import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertWishlistItemSchema } from '@shared/schema';
import { z } from 'zod';

// Get user's wishlist
export const getUserWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    const wishlistItems = await storage.getUserWishlist(userId);
    
    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
};

// Add item to wishlist
export const addToWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    const validatedData = insertWishlistItemSchema.parse({
      ...req.body,
      userId,
    });

    // Check if item already exists in wishlist
    const existingItem = await storage.getWishlistItem(userId, validatedData.productId);
    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }

    const wishlistItem = await storage.addToWishlist(validatedData);
    res.status(201).json({ success: true, wishlistItem });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Failed to add item to wishlist' });
  }
};

// Remove item from wishlist
export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    const { productId } = req.params;

    const success = await storage.removeFromWishlist(userId, parseInt(productId));
    
    if (!success) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    res.json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Failed to remove item from wishlist' });
  }
};

// Check if item is in wishlist
export const checkWishlistStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ isInWishlist: false });
    }

    const userId = (req.user as any).id;
    const { productId } = req.params;

    const existingItem = await storage.getWishlistItem(userId, parseInt(productId));
    res.json({ isInWishlist: !!existingItem });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({ message: 'Failed to check wishlist status' });
  }
};

export default {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
};