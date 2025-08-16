import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCartItemSchema } from "@shared/schema";

// Validate cart item data for adding/updating
const cartItemSchema = insertCartItemSchema.extend({
  quantity: z.number().int().positive().default(1)
});

// Schema for updating quantity only
const updateQuantitySchema = z.object({
  quantity: z.number().int().positive()
});

// Schema for updating cart item variants
const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  selectedColor: z.string().optional(),
  selectedSize: z.string().optional()
});

const cartController = {
  // Get all cart items for the authenticated user
  getCartItems: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      
      // Get cart items from database
      const cartItems = await storage.getCartItems(userId);
      
      // Fetch product details for each cart item
      const cartWithProductDetails = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          if (!product) {
            return null; // Product may have been deleted
          }
          
          return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              discountedPrice: product.originalPrice ? product.price : undefined,
              originalPrice: product.originalPrice,
              image: product.images[0] || "",
              stock: product.stock,
              hasVariants: product.hasVariants
            }
          };
        })
      );
      
      // Filter out any null items (deleted products)
      const validCartItems = cartWithProductDetails.filter(item => item !== null);
      
      return res.json(validCartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return res.status(500).json({ message: "Server error fetching cart items" });
    }
  },
  
  // Add an item to the cart
  addToCart: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      
      // Validate the request body
      const validatedData = cartItemSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if the product exists
      const product = await storage.getProductById(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the product is in stock
      if (product.stock < validatedData.quantity) {
        return res.status(400).json({ 
          message: "Not enough stock available",
          availableStock: product.stock
        });
      }
      
      // Check if the item is already in the cart
      const existingItems = await storage.getCartItems(userId);
      const existingItem = existingItems.find(item => item.productId === validatedData.productId);
      
      let result;
      if (existingItem) {
        // Update the quantity if the item is already in the cart
        const newQuantity = existingItem.quantity + validatedData.quantity;
        
        // Check if the new quantity exceeds available stock
        if (newQuantity > product.stock) {
          return res.status(400).json({ 
            message: "Not enough stock available for the requested quantity",
            availableStock: product.stock,
            currentQuantity: existingItem.quantity
          });
        }
        
        result = await storage.updateCartItemQuantity(existingItem.id, newQuantity);
      } else {
        // Add new item to cart
        result = await storage.addCartItem(validatedData);
      }
      
      return res.status(201).json({
        success: true,
        cartItem: result
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid cart item data", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: "Server error adding item to cart" });
    }
  },
  
  // Update cart item quantity
  updateCartItemQuantity: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      const cartItemId = parseInt(req.params.id);
      
      if (isNaN(cartItemId)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      // Validate the request body - allow both quantity and variant updates
      const updateData = updateCartItemSchema.parse(req.body);
      
      // Check if the cart item exists and belongs to the user
      const existingItems = await storage.getCartItems(userId);
      const existingItem = existingItems.find(item => item.id === cartItemId);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Check if the product exists and has enough stock
      const product = await storage.getProductById(existingItem.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Only check stock if quantity is being updated
      if (updateData.quantity && updateData.quantity > product.stock) {
        return res.status(400).json({ 
          message: "Not enough stock available",
          availableStock: product.stock
        });
      }
      
      // Update the cart item with new data
      const updatedItem = await storage.updateCartItem(cartItemId, updateData);
      
      return res.json({
        success: true,
        cartItem: updatedItem
      });
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quantity", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ message: "Server error updating cart item" });
    }
  },
  
  // Remove an item from the cart
  removeFromCart: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      const cartItemId = parseInt(req.params.id);
      
      if (isNaN(cartItemId)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      // Check if the cart item exists and belongs to the user
      const existingItems = await storage.getCartItems(userId);
      const existingItem = existingItems.find(item => item.id === cartItemId);
      
      if (!existingItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      // Remove the item from the cart
      const success = await storage.removeCartItem(cartItemId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to remove item from cart" });
      }
      
      return res.json({
        success: true,
        message: "Item removed from cart successfully"
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      return res.status(500).json({ message: "Server error removing item from cart" });
    }
  },
  
  // Clear all items from the cart
  clearCart: async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      
      // Clear the cart
      const success = await storage.clearCart(userId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to clear cart" });
      }
      
      return res.json({
        success: true,
        message: "Cart cleared successfully"
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      return res.status(500).json({ message: "Server error clearing cart" });
    }
  }
};

export default cartController;