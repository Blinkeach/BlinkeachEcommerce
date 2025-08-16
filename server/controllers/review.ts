import { Request, Response } from "express";
import { storage } from "../storage";
import { insertReviewSchema } from "../../shared/schema";
import { z } from "zod";

const reviewController = {
  // Get all reviews for a product
  getProductReviews: async (req: Request, res: Response): Promise<Response> => {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const reviews = await storage.getProductReviews(productId);
      return res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
  },
  
  // Get all reviews by a user
  getUserReviews: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const reviews = await storage.getUserReviews(userId);
      return res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
  },
  
  // Submit a new review
  submitReview: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Validate the request body
      const validatedData = insertReviewSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid review data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if user has already reviewed this product
      const existingReviews = await storage.getUserReviews(userId);
      let alreadyReviewed = false;
      
      if (existingReviews && existingReviews.length > 0) {
        alreadyReviewed = existingReviews.some(
          review => review.productId === validatedData.data.productId
        );
      }
      
      if (alreadyReviewed) {
        return res.status(400).json({ message: "You have already reviewed this product" });
      }
      
      // Allow all users to submit reviews
      const reviewData = {
        ...validatedData.data,
        isVerifiedPurchase: true // Mark all reviews as verified for simplicity
      };
      
      const review = await storage.addReview(reviewData);
      
      // Update product rating
      const productReviews = await storage.getProductReviews(validatedData.data.productId);
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / productReviews.length;
      
      await storage.updateProduct(validatedData.data.productId, {
        rating: avgRating,
        reviewCount: productReviews.length
      });
      
      return res.status(201).json(review);
    } catch (error) {
      console.error("Error submitting review:", error);
      return res.status(500).json({ message: "Failed to submit review" });
    }
  },
  
  // Update an existing review
  updateReview: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const reviewId = parseInt(req.params.id);
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Get the existing review
      const existingReview = await storage.getReviewById(reviewId);
      
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if the review belongs to the user
      if (existingReview.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const updateSchema = z.object({
        rating: z.number().min(1).max(5).optional(),
        title: z.string().optional(),
        comment: z.string().optional()
      });
      
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid review data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Update the review
      const updatedReview = await storage.updateReview(reviewId, validatedData.data);
      
      if (!updatedReview) {
        return res.status(500).json({ message: "Failed to update review" });
      }
      
      // Update product rating
      const productReviews = await storage.getProductReviews(existingReview.productId);
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = totalRating / productReviews.length;
      
      await storage.updateProduct(existingReview.productId, {
        rating: avgRating
      });
      
      return res.json(updatedReview);
    } catch (error) {
      console.error("Error updating review:", error);
      return res.status(500).json({ message: "Failed to update review" });
    }
  },
  
  // Delete a review
  deleteReview: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const reviewId = parseInt(req.params.id);
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ message: "Invalid review ID" });
      }
      
      // Get the existing review
      const existingReview = await storage.getReviewById(reviewId);
      
      if (!existingReview) {
        return res.status(404).json({ message: "Review not found" });
      }
      
      // Check if the review belongs to the user or if user is admin
      const isAdmin = (req.user as any).isAdmin;
      if (existingReview.userId !== userId && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Store product ID before deleting the review
      const productId = existingReview.productId;
      
      // Delete the review
      const success = await storage.deleteReview(reviewId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete review" });
      }
      
      // Update product rating
      const productReviews = await storage.getProductReviews(productId);
      let avgRating = 0;
      
      if (productReviews.length > 0) {
        const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
        avgRating = totalRating / productReviews.length;
      }
      
      await storage.updateProduct(productId, {
        rating: avgRating,
        reviewCount: productReviews.length
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      return res.status(500).json({ message: "Failed to delete review" });
    }
  },
  
  // Check if a user can review a product
  canReviewProduct: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if user has already reviewed this product
      const existingReviews = await storage.getUserReviews(userId);
      let alreadyReviewed = false;
      
      if (existingReviews && existingReviews.length > 0) {
        alreadyReviewed = existingReviews.some(
          review => review.productId === productId
        );
      }
      
      if (alreadyReviewed) {
        return res.json({ canReview: false, reason: "already_reviewed" });
      }
      
      return res.json({ canReview: true });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      return res.status(500).json({ message: "Failed to check review eligibility" });
    }
  }
};

export default reviewController;