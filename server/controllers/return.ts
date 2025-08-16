import { Request, Response } from "express";
import { storage } from "../storage";
import { insertReturnRequestSchema } from "../../shared/schema";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs";

const returnController = {
  // Submit a new return request
  submitReturnRequest: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Check if using same address as delivery
      const isSameAsDelivery = req.body.isSameAsDelivery;
      
      // Get data ready for validation
      let validationData = {
        ...req.body,
        userId
      };
      
      // If using same address as delivery, we need to get the delivery address from the order
      if (isSameAsDelivery) {
        const order = await storage.getOrderById(req.body.orderId);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        
        // Parse the order's shipping address which is stored as a string
        // Format is expected to be: "name, street address, city, state, pincode"
        try {
          const lastCommaIndex = order.shippingAddress.lastIndexOf(', ');
          if (lastCommaIndex === -1) throw new Error("Invalid address format");
          
          const pincodeOrPhonePart = order.shippingAddress.substring(lastCommaIndex + 2);
          const addressWithoutPincode = order.shippingAddress.substring(0, lastCommaIndex);
          
          const secondLastCommaIndex = addressWithoutPincode.lastIndexOf(', ');
          if (secondLastCommaIndex === -1) throw new Error("Invalid address format");
          
          const statePart = addressWithoutPincode.substring(secondLastCommaIndex + 2);
          const addressWithoutState = addressWithoutPincode.substring(0, secondLastCommaIndex);
          
          const thirdLastCommaIndex = addressWithoutState.lastIndexOf(', ');
          if (thirdLastCommaIndex === -1) throw new Error("Invalid address format");
          
          const cityPart = addressWithoutState.substring(thirdLastCommaIndex + 2);
          const addressPart = addressWithoutState.substring(0, thirdLastCommaIndex);
          
          // India phone numbers are usually 10 digits, but can include country code
          const isPincode = /^\d{6}$/.test(pincodeOrPhonePart);
          
          let pincode, phone;
          if (isPincode) {
            pincode = pincodeOrPhonePart;
            // In this case, we need to get the phone from user data
            phone = (req.user as any).phone || '';
          } else {
            // Assuming the format includes both pincode and phone
            // Try to extract the pincode from state part (e.g., "Delhi - 110001")
            const pincodeMatch = statePart.match(/\d{6}/);
            if (pincodeMatch) {
              pincode = pincodeMatch[0];
              // Clean up the state part
              const cleanedState = statePart.replace(/\s*-\s*\d{6}/, '');
              phone = pincodeOrPhonePart;
            } else {
              // If we can't determine pincode, use a fallback approach
              pincode = '';
              phone = pincodeOrPhonePart;
            }
          }
          
          // Add these to the validation data
          validationData = {
            ...validationData,
            pickupAddress: addressPart,
            pickupCity: cityPart,
            pickupState: statePart,
            pickupPincode: pincode,
            pickupPhone: phone
          };
        } catch (error) {
          console.log("Error parsing shipping address:", order.shippingAddress);
          return res.status(400).json({ 
            message: "Invalid shipping address format in order. Please use a different address." 
          });
        }
      }
      
      // Validate the request body
      const validatedData = insertReturnRequestSchema.safeParse(validationData);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid return request data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Get the order to verify ownership and eligibility
      const order = await storage.getOrderById(validatedData.data.orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify the order belongs to the user
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied - this order doesn't belong to you" });
      }
      
      // Verify the order is in 'delivered' status
      if (order.status !== "delivered") {
        return res.status(400).json({ 
          message: "Return requests can only be created for delivered orders" 
        });
      }
      
      // Check if there's already a return request for this order
      const existingRequest = await storage.getReturnRequestByOrderId(validatedData.data.orderId);
      if (existingRequest) {
        return res.status(400).json({ 
          message: "A return request already exists for this order" 
        });
      }
      
      // Check if the order is within the 7-day return window
      const deliveryDate = order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt || Date.now());
      const currentDate = new Date();
      const daysSinceDelivery = Math.floor(
        (currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceDelivery > 7) {
        return res.status(400).json({ 
          message: "Return period has expired. Orders can only be returned within 7 days of delivery." 
        });
      }
      
      // Create the return request
      const returnRequest = await storage.createReturnRequest(validatedData.data);
      
      return res.status(201).json(returnRequest);
    } catch (error) {
      console.error("Error submitting return request:", error);
      return res.status(500).json({ message: "Failed to submit return request" });
    }
  },
  
  // Get user's return requests
  getUserReturnRequests: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const returnRequests = await storage.getUserReturnRequests(userId);
      
      return res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching user return requests:", error);
      return res.status(500).json({ message: "Failed to fetch return requests" });
    }
  },
  
  // Check if an order is eligible for return
  checkReturnEligibility: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Get the order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify the order belongs to the user
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied - this order doesn't belong to you" });
      }
      
      // Check if already returned
      const existingRequest = await storage.getReturnRequestByOrderId(orderId);
      if (existingRequest) {
        return res.json({ 
          eligible: false, 
          reason: "already_requested",
          requestStatus: existingRequest.status,
          requestId: existingRequest.id
        });
      }
      
      // Check if order is delivered
      if (order.status !== "delivered") {
        return res.json({ 
          eligible: false, 
          reason: "not_delivered" 
        });
      }
      
      // Check if within 7 days
      const deliveryDate = order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt || Date.now());
      const currentDate = new Date();
      const daysSinceDelivery = Math.floor(
        (currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceDelivery > 7) {
        return res.json({ 
          eligible: false, 
          reason: "expired",
          daysSinceDelivery
        });
      }
      
      // All checks passed
      return res.json({ 
        eligible: true,
        daysSinceDelivery,
        daysRemaining: 7 - daysSinceDelivery
      });
    } catch (error) {
      console.error("Error checking return eligibility:", error);
      return res.status(500).json({ message: "Failed to check return eligibility" });
    }
  },
  
  // ========== ADMIN ENDPOINTS ==========
  
  // Get all return requests (admin only)
  getAllReturnRequests: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Access denied - admin only" });
      }
      
      const returnRequests = await storage.getAllReturnRequests();
      
      return res.json(returnRequests);
    } catch (error) {
      console.error("Error fetching all return requests:", error);
      return res.status(500).json({ message: "Failed to fetch return requests" });
    }
  },
  
  // Approve a return request (admin only)
  approveReturnRequest: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Access denied - admin only" });
      }
      
      const returnId = parseInt(req.params.id);
      
      if (isNaN(returnId)) {
        return res.status(400).json({ message: "Invalid return request ID" });
      }
      
      // Get the return request
      const returnRequest = await storage.getReturnRequestById(returnId);
      
      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }
      
      // Can only approve pending requests
      if (returnRequest.status !== "pending") {
        return res.status(400).json({ 
          message: `Cannot approve a return request with status: ${returnRequest.status}` 
        });
      }
      
      // Add admin notes if provided
      const updateData: { status: string, adminNotes?: string } = { 
        status: "approved"
      };
      
      if (req.body.adminNotes) {
        updateData.adminNotes = req.body.adminNotes;
      }
      
      // Update the return request
      const updatedRequest = await storage.updateReturnRequest(returnId, updateData);
      
      if (!updatedRequest) {
        return res.status(500).json({ message: "Failed to approve return request" });
      }
      
      return res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving return request:", error);
      return res.status(500).json({ message: "Failed to approve return request" });
    }
  },
  
  // Reject a return request (admin only)
  rejectReturnRequest: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Access denied - admin only" });
      }
      
      const returnId = parseInt(req.params.id);
      
      if (isNaN(returnId)) {
        return res.status(400).json({ message: "Invalid return request ID" });
      }
      
      // Validate admin notes as the rejection reason
      const rejectSchema = z.object({
        adminNotes: z.string().min(1, "Admin notes are required for rejection")
      });
      
      const validatedData = rejectSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Please provide a rejection reason in the admin notes", 
          errors: validatedData.error.format() 
        });
      }
      
      // Get the return request
      const returnRequest = await storage.getReturnRequestById(returnId);
      
      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }
      
      // Can only reject pending requests
      if (returnRequest.status !== "pending") {
        return res.status(400).json({ 
          message: `Cannot reject a return request with status: ${returnRequest.status}` 
        });
      }
      
      // Update the return request
      const updatedRequest = await storage.updateReturnRequest(returnId, {
        status: "rejected",
        adminNotes: validatedData.data.adminNotes,
        rejectionReason: validatedData.data.adminNotes // Use the correct Drizzle schema field name
      });
      
      if (!updatedRequest) {
        return res.status(500).json({ message: "Failed to reject return request" });
      }
      
      return res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting return request:", error);
      return res.status(500).json({ message: "Failed to reject return request" });
    }
  },
  
  // Handle image uploads for return requests
  uploadReturnImages: async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const returnId = req.query.returnId ? parseInt(req.query.returnId as string) : null;
      
      if (!returnId) {
        return res.status(400).json({ message: "Return ID is required" });
      }
      
      // Check if return request exists and belongs to user
      const returnRequest = await storage.getReturnRequestById(returnId);
      
      if (!returnRequest) {
        return res.status(404).json({ message: "Return request not found" });
      }
      
      // Security check - ensure user can only upload images for their own returns
      if (returnRequest.userId !== userId && !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if files were uploaded
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }
      
      // Create directory for return images if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'returns');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Process uploaded files
      const returnImagesDir = path.join(uploadsDir, returnId.toString());
      if (!fs.existsSync(returnImagesDir)) {
        fs.mkdirSync(returnImagesDir, { recursive: true });
      }
      
      // Store image file paths in the database
      const imagePaths: string[] = [];
      
      // Transfer the uploaded files
      for (const file of req.files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, '-')}`;
        const filePath = path.join(returnImagesDir, fileName);
        
        // Write the file
        fs.writeFileSync(filePath, file.buffer);
        
        // Add the relative path to the array
        const relativePath = `/uploads/returns/${returnId}/${fileName}`;
        imagePaths.push(relativePath);
      }
      
      // Update the return request with image paths
      // Note: in a real implementation, you'd store these in a join table or as JSON
      // For this example, we'll join them as a comma-separated string
      const imageUrlsString = imagePaths.join(',');
      
      const updatedReturn = await storage.updateReturnRequest(returnId, {
        images: imagePaths
      });
      
      return res.status(200).json({
        message: "Images uploaded successfully",
        images: imagePaths,
        returnRequest: updatedReturn
      });
    } catch (error) {
      console.error("Error uploading return images:", error);
      return res.status(500).json({ message: "Failed to upload images" });
    }
  }
};

export default returnController;