import { Request, Response } from "express";
import { z } from "zod";
import { sendEmail } from "../services/email";
import { db } from "../db";
import { supportRequests } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Validation schema for callback requests
const callbackRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(5, "Valid phone number is required"),
  preferredLanguage: z.enum(["english", "hindi"]),
  email: z.string().email("Valid email is required").optional(),
  notes: z.string().optional(),
});

// Type for callback requests
type CallbackRequest = z.infer<typeof callbackRequestSchema>;

const supportController = {
  // Handle callback requests
  submitCallbackRequest: async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = callbackRequestSchema.parse(req.body);
      
      // Store the callback request in the database
      const [supportRequest] = await db.insert(supportRequests).values({
        type: "callback",
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
        preferredLanguage: validatedData.preferredLanguage,
        notes: validatedData.notes,
        status: "pending"
      }).returning();
      
      console.log("Callback request received:", validatedData);
      
      // Send email notification to admin
      const emailSubject = `New Callback Request from ${validatedData.name}`;
      const emailHtml = `
        <h2>New Callback Request</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Phone:</strong> ${validatedData.phone}</p>
        <p><strong>Preferred Language:</strong> ${validatedData.preferredLanguage}</p>
        ${validatedData.email ? `<p><strong>Email:</strong> ${validatedData.email}</p>` : ''}
        ${validatedData.notes ? `<p><strong>Notes:</strong> ${validatedData.notes}</p>` : ''}
        <p><strong>Requested at:</strong> ${new Date().toLocaleString()}</p>
      `;
      
      const emailText = `
        New Callback Request
        
        Name: ${validatedData.name}
        Phone: ${validatedData.phone}
        Preferred Language: ${validatedData.preferredLanguage}
        ${validatedData.email ? `Email: ${validatedData.email}` : ''}
        ${validatedData.notes ? `Notes: ${validatedData.notes}` : ''}
        Requested at: ${new Date().toLocaleString()}
      `;
      
      await sendEmail({
        to: "blinkeach@gmail.com",
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      
      // Return success response
      res.json({
        success: true,
        message: "Callback request received successfully",
      });
    } catch (error) {
      console.error("Error processing callback request:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to process callback request",
      });
    }
  },
  
  // Handle support email messages
  submitSupportEmail: async (req: Request, res: Response) => {
    try {
      // Required fields validation
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: "Name, email and message are required",
        });
      }
      
      // In a real implementation, you would store this in a database
      console.log("Support email received:", req.body);
      
      // Send email notification to admin
      const emailSubject = `Support Message from ${name}`;
      const emailHtml = `
        <h2>New Support Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `;
      
      const emailText = `
        New Support Message
        
        Name: ${name}
        Email: ${email}
        Message: ${message}
        Sent at: ${new Date().toLocaleString()}
      `;
      
      await sendEmail({
        to: "blinkeach@gmail.com",
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      
      // Return success response
      res.json({
        success: true,
        message: "Support message sent successfully",
      });
    } catch (error) {
      console.error("Error processing support email:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send support message",
      });
    }
  },
  
  // Fetch all support requests from database
  getActiveSupportRequests: async (req: Request, res: Response) => {
    try {
      // Fetch all support requests from database, ordered by most recent first
      const requests = await db
        .select()
        .from(supportRequests)
        .orderBy(desc(supportRequests.createdAt));
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching support requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch support requests",
      });
    }
  },
  
  // Update support request status
  updateSupportRequestStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || !status || !['completed', 'cancelled', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request. ID and valid status required",
        });
      }
      
      // Update the support request status in the database
      const [updatedRequest] = await db
        .update(supportRequests)
        .set({ 
          status: status,
          updatedAt: new Date()
        })
        .where(eq(supportRequests.id, parseInt(id)))
        .returning();

      if (!updatedRequest) {
        return res.status(404).json({
          success: false,
          message: "Support request not found",
        });
      }
      
      console.log(`Updated support request ${id} status to ${status}`);
      
      res.json({
        success: true,
        message: "Support request status updated successfully",
        data: updatedRequest
      });
    } catch (error) {
      console.error("Error updating support request status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update support request status",
      });
    }
  },
};

export default supportController;