import { Request, Response } from "express";
import { storage } from "../storage";
import { insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { z } from "zod";
import adminController from "./admin";
import { sendOrderConfirmation, sendOrderStatusUpdate, sendReviewRequest } from "../services/email";
import deliveryService, { orderToDeliveryRequest } from "../services/delivery";

const orderController = {
  // Get all orders (admin only in a real application)
  getAllOrders: async (req: Request, res: Response) => {
    try {
      // In a real application, we would check if the user is an admin
      const orders = await storage.getOrders();
      
      // For each order, get the order items
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  },
  
  // Get a specific order by ID
  getOrderById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // In a real application, we would check if the user is authorized to view this order
      
      const items = await storage.getOrderItems(order.id);
      
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  },
  
  // Get orders by user
  getOrdersByUser: async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the authenticated user has permission to access these orders
      // If user is not authenticated or not an admin, they can only see their own orders
      if (req.user && (req.user.id === userId || req.user.isAdmin)) {
        // User is authorized to view these orders (either their own or as admin)
        const orders = await storage.getOrdersByUserId(userId);
        
        // For each order, get the order items
        const ordersWithItems = await Promise.all(
          orders.map(async (order) => {
            const items = await storage.getOrderItems(order.id);
            return { ...order, items };
          })
        );
        
        res.json(ordersWithItems);
      } else {
        // User is trying to access another user's orders without permission
        console.warn(`Unauthorized attempt to access orders for user ID ${userId}`);
        res.status(403).json({ message: "You don't have permission to view these orders" });
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  },
  
  // Get orders for the current authenticated user
  getCurrentUserOrders: async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const orders = await storage.getOrdersByUserId(userId);
      
      // For each order, get the order items
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, items };
        })
      );
      
      res.json(ordersWithItems);
    } catch (error) {
      console.error("Error fetching current user orders:", error);
      res.status(500).json({ message: "Failed to fetch your orders" });
    }
  },
  
  // Create a new order
  createOrder: async (req: Request, res: Response) => {
    try {
      // Validate order data
      const orderData = insertOrderSchema.parse(req.body);
      
      // Create the order
      const order = await storage.createOrder(orderData);
      
      // Add order items
      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }
      
      const orderItems = await Promise.all(
        items.map(async (item) => {
          const orderItem = {
            orderId: order.id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          };
          
          return await storage.addOrderItem(orderItem);
        })
      );
      
      // Get user data for notifications
      const user = await storage.getUser(order.userId);
      
      // Initialize delivery tracking (prepare for shipping)
      let trackingInfo = null;
      if (user) {
        try {
          // For orders that will be shipped, pre-register with delivery service
          // This is a preparatory step that happens before actual shipment
          // Real shipment will be created when status changes to "shipped"
          const deliveryRequest = orderToDeliveryRequest(order, user, orderItems);
          
          // In some delivery systems, we might get an initial tracking ID at this stage
          // For our implementation, we'll simply pre-generate it
          const date = new Date();
          const trackingId = `BLK-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${order.id}`;
          
          trackingInfo = {
            trackingId: trackingId,
            trackingUrl: deliveryService.getTrackingUrl(trackingId)
          };
          
          console.log(`Pre-registered shipment for order #${order.id} with tracking ID: ${trackingInfo.trackingId}`);
        } catch (deliveryError) {
          console.error(`Error pre-registering delivery for order #${order.id}:`, deliveryError);
        }
      }
      
      if (user) {
        // Send order confirmation email to the customer with tracking info
        try {
          await sendOrderConfirmation(
            order, 
            user.email, 
            user.fullName,
            trackingInfo
          );
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
        }
        
        // Send notification to admin
        try {
          // Send notification email to admin
          await sendOrderConfirmation(
            order, 
            "blinkeach@gmail.com", 
            "Admin",
            trackingInfo
          );
        } catch (adminEmailError) {
          console.error("Failed to send admin notification email:", adminEmailError);
        }
      }
      
      // Return the created order with items and tracking info
      const responseData = { 
        ...order, 
        items: orderItems,
        ...(trackingInfo && { tracking: trackingInfo })
      };
      
      res.status(201).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  },
  
  // Update order status
  updateOrderStatus: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status", 
          validStatuses 
        });
      }
      
      // In a real application, we would check if the user is authorized to update this order
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const items = await storage.getOrderItems(updatedOrder.id);
      
      // Get user data for notifications
      const user = await storage.getUser(updatedOrder.userId);
      
      // Handle tracking information for shipping
      let trackingInfo = null;
      
      if (status === 'processing') {
        // When order is being processed, initiate delivery setup
        // This is when we would prepare the shipment with the courier service
        console.log(`Preparing shipment for order #${updatedOrder.id}`);
      }
      else if (status === 'shipped') {
        // When order is shipped, create actual shipment with delivery service
        try {
          if (user) {
            // Create the delivery request using the order and user info
            const deliveryRequest = orderToDeliveryRequest(updatedOrder, user, items);
            const shipmentResponse = await deliveryService.createShipment(deliveryRequest);
            
            if (shipmentResponse.success) {
              trackingInfo = {
                trackingId: shipmentResponse.trackingId || '',
                trackingUrl: shipmentResponse.trackingUrl || deliveryService.getTrackingUrl(shipmentResponse.trackingId || '')
              };
              
              console.log(`Shipment created for order #${updatedOrder.id} with tracking ID: ${trackingInfo.trackingId}`);
            } else {
              console.error(`Failed to create shipment for order #${updatedOrder.id}:`, shipmentResponse.message);
            }
          }
        } catch (shipmentError) {
          console.error(`Error creating shipment for order #${updatedOrder.id}:`, shipmentError);
        }
      }
      else if (status === 'delivered') {
        // When order is delivered, send review request email after a delay
        // In a real application, we might schedule this for a few days later
        setTimeout(async () => {
          if (user) {
            try {
              await sendReviewRequest(updatedOrder, user.email, user.fullName);
              console.log(`Review request sent for order #${updatedOrder.id}`);
            } catch (reviewEmailError) {
              console.error(`Failed to send review request for order #${updatedOrder.id}:`, reviewEmailError);
            }
          }
        }, 1000 * 60 * 5); // 5 minutes delay as a demonstration (would be days in production)
      }
      
      if (user) {
        // Send order status update email to the customer
        try {
          await sendOrderStatusUpdate(
            updatedOrder, 
            user.email, 
            user.fullName,
            trackingInfo
          );
        } catch (emailError) {
          console.error("Failed to send order status update email:", emailError);
        }
        
        // For shipped and delivered statuses, notify admin as well
        if (status === "shipped" || status === "delivered") {
          try {
            // Send notification email to admin
            await sendOrderStatusUpdate(
              updatedOrder, 
              "blinkeach@gmail.com", 
              "Admin",
              trackingInfo
            );
          } catch (adminEmailError) {
            console.error("Failed to send admin notification email:", adminEmailError);
          }
        }
      }
      
      // Include tracking info in the response if available
      const responseData = { 
        ...updatedOrder, 
        items,
        ...(trackingInfo && { tracking: trackingInfo })
      };
      
      res.json(responseData);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  }
};

export default orderController;
