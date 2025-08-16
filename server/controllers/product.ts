import { Request, Response } from "express";
import { storage } from "../storage";
import { insertProductSchema, Product } from "@shared/schema";
import { z } from "zod";

// Helper function to extract a valid image from the images array
function extractValidImage(product: Product): string {
  let validImage = '/api/placeholder-image'; // fallback
  
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    // Find first valid image (prioritize local uploads over external URLs)
    const localImage = product.images.find(img => img.startsWith('/uploads/'));
    const unsplashImage = product.images.find(img => 
      img.startsWith('https://images.unsplash.com')
    );
    const placeholderImage = product.images.find(img => 
      img.startsWith('https://via.placeholder.com')
    );
    
    validImage = localImage || unsplashImage || placeholderImage || '/api/placeholder-image';
  }
  
  return validImage;
}

const productController = {
  // Get multiple products by IDs (for recently viewed functionality)
  getProductsByIds: async (req: Request, res: Response) => {
    try {
      const { ids } = req.query;
      
      if (!ids) {
        return res.status(400).json({ message: "Product IDs are required" });
      }
      
      // Convert comma-separated string to array of numbers
      const productIds = (ids as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      
      if (productIds.length === 0) {
        return res.status(400).json({ message: "Invalid product IDs format" });
      }
      
      // Fetch products by IDs
      const products = await Promise.all(
        productIds.map(async (id) => {
          return await storage.getProductById(id);
        })
      );
      
      // Filter out any undefined/null products
      const validProducts = products.filter(p => p !== undefined && p !== null);
      
      res.json(validProducts);
    } catch (error) {
      console.error("Error fetching products by IDs:", error);
      res.status(500).json({ message: "Failed to fetch products by IDs" });
    }
  },
  // Get related products based on category and current product ID
  getRelatedProducts: async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // First get the product to determine its category
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const { category } = product;
      
      // Get products in the same category, excluding the current product
      const products = await storage.getProducts({ category });
      
      // Filter out the current product and limit to 5 items
      const relatedProducts = products
        .filter(p => p.id !== productId)
        .slice(0, 5);
      
      res.json(relatedProducts);
    } catch (error) {
      console.error("Error fetching related products:", error);
      res.status(500).json({ message: "Failed to fetch related products" });
    }
  },
  // Get all products with optional filtering and sorting
  getAllProducts: async (req: Request, res: Response) => {
    try {
      const { category, search, minPrice, maxPrice, sortBy } = req.query;
      
      const filters = {
        category: category as string | undefined,
        search: search as string | undefined,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
        sortBy: sortBy as string | undefined
      };
      
      const products = await storage.getProducts(filters);
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  },
  
  // Get a specific product by ID
  getProductById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  },
  
  // Get products by category
  getProductsByCategory: async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
      
      const products = await storage.getProductsByCategory(category);
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  },
  
  // Get deal products (products with discounts)
  getDeals: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const products = await storage.getDeals(limit);
      
      // Transform products to include single image property for frontend compatibility
      const transformedProducts = products.map(product => ({
        ...product,
        image: extractValidImage(product)
      }));
      
      res.json(transformedProducts);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  },
  
  // Get top selling products
  getTopSellingProducts: async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const products = await storage.getTopSellingProducts(limit);
      
      // Transform products to include single image property for frontend compatibility
      const transformedProducts = products.map(product => ({
        ...product,
        image: extractValidImage(product)
      }));
      
      res.json(transformedProducts);
    } catch (error) {
      console.error("Error fetching top selling products:", error);
      res.status(500).json({ message: "Failed to fetch top selling products" });
    }
  },
  
  // Create a new product
  createProduct: async (req: Request, res: Response) => {
    try {
      const { variants, ...productData } = req.body;
      
      // Validate product data
      const validatedProductData = insertProductSchema.parse(productData);
      
      // Create the product first
      const product = await storage.createProduct(validatedProductData);
      
      // If product has variants, create them
      if (variants && Array.isArray(variants) && variants.length > 0) {
        for (const variant of variants) {
          await storage.createProductVariant({
            productId: product.id,
            colorName: variant.colorName,
            colorValue: variant.colorValue,
            sizeName: variant.sizeName,
            stock: variant.stock,
            images: variant.images || [],
            price: variant.price || null,
            sku: variant.sku || null
          });
        }
      }
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  },
  
  // Update an existing product
  updateProduct: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const { variants, ...productData } = req.body;
      
      // Update the main product
      const updatedProduct = await storage.updateProduct(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Handle variants if provided
      if (variants && Array.isArray(variants)) {
        // Delete existing variants for this product
        await storage.deleteProductVariants(id);
        
        // Create new variants
        for (const variant of variants) {
          await storage.createProductVariant({
            productId: id,
            colorName: variant.colorName,
            colorValue: variant.colorValue,
            sizeName: variant.sizeName,
            stock: variant.stock,
            images: variant.images || [],
            price: variant.price || null,
            sku: variant.sku || null
          });
        }
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  },
  
  // Delete a product
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  },

  // Get personalized recommendations
  getPersonalizedRecommendations: async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const currentProductId = req.query.currentProductId ? parseInt(req.query.currentProductId as string) : undefined;
      const category = req.query.category as string;
      const limit = parseInt(req.query.limit as string) || 8;

      // Get all products first
      const allProducts = await storage.getProducts({});
      
      if (allProducts.length === 0) {
        return res.json([]);
      }

      let recommendations: any[] = [];

      // Strategy 1: If user is viewing a specific product, recommend similar products
      if (currentProductId) {
        const currentProduct = await storage.getProductById(currentProductId);
        if (currentProduct) {
          // Find products in the same category
          recommendations = allProducts.filter(p => 
            p.id !== currentProductId && 
            p.category === currentProduct.category &&
            p.stock > 0
          );
        }
      }

      // Strategy 2: If category is specified, prioritize products from that category
      if (category && recommendations.length < limit) {
        const categoryProducts = allProducts.filter(p => 
          p.category === category && 
          p.stock > 0 &&
          !recommendations.some(r => r.id === p.id)
        );
        recommendations = [...recommendations, ...categoryProducts];
      }

      // Strategy 3: Add top-rated products if we still need more
      if (recommendations.length < limit) {
        const topRated = allProducts
          .filter(p => 
            p.stock > 0 && 
            !recommendations.some(r => r.id === p.id)
          )
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        recommendations = [...recommendations, ...topRated];
      }

      // Strategy 4: Add discounted products for variety
      if (recommendations.length < limit) {
        const discountedProducts = allProducts
          .filter(p => 
            p.stock > 0 && 
            p.originalPrice && 
            p.originalPrice > p.price &&
            !recommendations.some(r => r.id === p.id)
          )
          .sort((a, b) => {
            const discountA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
            const discountB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
            return discountB - discountA;
          });
        
        recommendations = [...recommendations, ...discountedProducts];
      }

      // Strategy 5: Fill remaining slots with random popular products
      if (recommendations.length < limit) {
        const remaining = allProducts
          .filter(p => 
            p.stock > 0 && 
            !recommendations.some(r => r.id === p.id)
          )
          .sort(() => Math.random() - 0.5); // Shuffle for variety
        
        recommendations = [...recommendations, ...remaining];
      }

      // Limit to requested number and format response
      const finalRecommendations = recommendations.slice(0, limit).map(product => {
        const discount = product.originalPrice && product.originalPrice > product.price 
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : 0;
        
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: discount,
          images: product.images || [],
          rating: product.rating || 4.0,
          reviewCount: product.reviewCount || 0,
          category: product.category,
          inStock: product.stock > 0,
          stock: product.stock
        };
      });

      res.json(finalRecommendations);
    } catch (error) {
      console.error("Error getting personalized recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  }
};

export default productController;
