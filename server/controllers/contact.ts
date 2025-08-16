import { Request, Response } from "express";
import { z } from "zod";
import { sendEmail } from "../services/email";
import { db } from "../db";
import { contactMessages, insertContactMessageSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Validation schema for contact messages
const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(3, "Message must be at least 3 characters"),
});

const contactController = {
  // Handle contact form submissions
  submitContactMessage: async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = contactMessageSchema.parse(req.body);
      
      // Save the message to database
      const [newMessage] = await db
        .insert(contactMessages)
        .values({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          subject: validatedData.subject,
          message: validatedData.message,
          status: 'new',
        })
        .returning();
      
      // Send email notification to admin
      const emailSubject = `New Contact Message: ${validatedData.subject}`;
      const emailHtml = `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${validatedData.name}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        ${validatedData.phone ? `<p><strong>Phone:</strong> ${validatedData.phone}</p>` : ''}
        <p><strong>Subject:</strong> ${validatedData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${validatedData.message}</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `;
      
      const emailText = `
        New Contact Message
        
        Name: ${validatedData.name}
        Email: ${validatedData.email}
        ${validatedData.phone ? `Phone: ${validatedData.phone}` : ''}
        Subject: ${validatedData.subject}
        Message: ${validatedData.message}
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
        message: "Your message has been sent successfully. We'll get back to you soon.",
        data: newMessage
      });
    } catch (error) {
      console.error("Error processing contact message:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors,
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to send your message. Please try again later.",
      });
    }
  },
  
  // Get all contact messages (admin only)
  getContactMessages: async (req: Request, res: Response) => {
    try {
      // Fetch all contact messages from database, ordered by most recent first
      const messages = await db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt));
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact messages",
      });
    }
  },
  
  // Update message status (admin only)
  updateMessageStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || !status || !['read', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request. ID and valid status required",
        });
      }
      
      // Update the message status in the database
      const [updatedMessage] = await db
        .update(contactMessages)
        .set({ 
          status: status,
          updatedAt: new Date()
        })
        .where(eq(contactMessages.id, parseInt(id)))
        .returning();

      if (!updatedMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }
      
      res.json({
        success: true,
        message: "Message status updated successfully",
        data: updatedMessage
      });
    } catch (error) {
      console.error("Error updating message status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update message status",
      });
    }
  },
};

export default contactController;