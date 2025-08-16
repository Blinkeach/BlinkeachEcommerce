import { Request, Response } from "express";
import { storage } from "../storage";
import { nanoid } from "nanoid";
import { z } from "zod";
import { insertReferralSchema } from "@shared/schema";

// Generate a unique referral code
const generateReferralCode = () => {
  return nanoid(8).toUpperCase(); // 8 character uppercase code
};

// Create a new referral code for a user
export const createReferralCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    
    // Check if user already has a referral code
    const existingReferral = await storage.getUserReferral(userId);
    if (existingReferral) {
      return res.json(existingReferral); // Return existing code if already created
    }
    
    // Generate a new code
    const referralCode = generateReferralCode();
    
    // Save the new referral code
    const referral = await storage.createReferral({
      userId,
      referralCode
    });
    
    res.status(201).json(referral);
  } catch (error) {
    console.error("Error creating referral code:", error);
    res.status(500).json({ message: "Failed to create referral code" });
  }
};

// Get a user's referral code
export const getUserReferralCode = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    const referral = await storage.getUserReferral(userId);
    
    if (!referral) {
      // Create a new referral code if one doesn't exist
      const referralCode = generateReferralCode();
      const newReferral = await storage.createReferral({
        userId,
        referralCode
      });
      return res.json(newReferral);
    }
    
    res.json(referral);
  } catch (error) {
    console.error("Error getting referral code:", error);
    res.status(500).json({ message: "Failed to get referral code" });
  }
};

// Validate a referral code
export const validateReferralCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ message: "Referral code is required" });
    }
    
    const referral = await storage.getReferralByCode(code);
    
    if (!referral) {
      return res.status(404).json({ 
        valid: false,
        message: "Invalid referral code" 
      });
    }
    
    // Prevent self-referral
    if (req.user && (req.user as any).id === referral.userId) {
      return res.status(400).json({ 
        valid: false,
        message: "You cannot use your own referral code" 
      });
    }
    
    res.json({ 
      valid: true,
      referrerId: referral.userId 
    });
  } catch (error) {
    console.error("Error validating referral code:", error);
    res.status(500).json({ message: "Failed to validate referral code" });
  }
};

// Get rewards received by the current user
export const getUserRewards = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = (req.user as any).id;
    const rewards = await storage.getUserReceivedRewards(userId);
    
    // Calculate total reward amount (converting from paise to rupees)
    const totalAmount = rewards.reduce((total, reward) => {
      if (reward.status === 'processed') {
        return total + reward.amount;
      }
      return total;
    }, 0) / 100; // Convert paise to rupees
    
    res.json({
      rewards,
      totalAmount, // In rupees
      pendingCount: rewards.filter(reward => reward.status === 'pending').length
    });
  } catch (error) {
    console.error("Error getting user rewards:", error);
    res.status(500).json({ message: "Failed to get rewards" });
  }
};

// Process a pending reward (admin only)
export const processReward = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rewardId = parseInt(id);
    
    if (isNaN(rewardId)) {
      return res.status(400).json({ message: "Invalid reward ID" });
    }
    
    const reward = await storage.updateReferralRewardStatus(rewardId, 'processed');
    
    if (!reward) {
      return res.status(404).json({ message: "Reward not found" });
    }
    
    res.json(reward);
  } catch (error) {
    console.error("Error processing reward:", error);
    res.status(500).json({ message: "Failed to process reward" });
  }
};