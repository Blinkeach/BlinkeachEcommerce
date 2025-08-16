import type { Express, Request, Response } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import productController from "./controllers/product";
import userController from "./controllers/user";
import orderController from "./controllers/order";
import paymentController from "./controllers/payment";
import chatbotController from "./controllers/chatbot";
import categoryController from "./controllers/category";
import adminController from "./controllers/admin";
import uploadController, { upload, upload3d } from "./controllers/upload";
import supportController from "./controllers/support";
import contactController from "./controllers/contact";
import cartController from "./controllers/cart";
import { setupAuth } from "./auth";
import ChatServer from "./chat";
import reviewController from "./controllers/review";
import returnController from "./controllers/return";
import * as referralController from "./controllers/referralController";
import wishlistController from "./controllers/wishlist";
import socialRoutes from "./routes/social";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { deliveryService } from "./services/delivery";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from the uploads directory
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  // Set up authentication
  const { isAuthenticated, isAdmin } = setupAuth(app);
  
  // Prefix all routes with /api
  
  // Search routes
  app.get("/api/search/suggestions", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const suggestions = await storage.searchProductSuggestions(query);
      res.json(suggestions);
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // Product routes
  app.get("/api/products", productController.getAllProducts);
  app.get("/api/products/deals", productController.getDeals);
  app.get("/api/products/top-selling", productController.getTopSellingProducts);
  app.get("/api/products/details", productController.getProductsByIds); // New route for fetching multiple products by IDs
  app.get("/api/products/category/:category", productController.getProductsByCategory);
  app.get("/api/products/:id/related", productController.getRelatedProducts);
  app.get("/api/products/:id", productController.getProductById);
  app.post("/api/products", isAdmin, productController.createProduct);
  app.put("/api/products/:id", isAdmin, productController.updateProduct);
  app.delete("/api/products/:id", isAdmin, productController.deleteProduct);
  
  // Product Variant routes
  app.get("/api/products/:productId/variants", adminController.getProductVariants);
  app.post("/api/products/variants", isAdmin, adminController.createProductVariant);
  app.put("/api/products/variants/:id", isAdmin, adminController.updateProductVariant);
  app.delete("/api/products/variants/:id", isAdmin, adminController.deleteProductVariant);
  
  // Recommendation routes
  app.get("/api/recommendations", productController.getPersonalizedRecommendations);
  
  // Legacy User routes - to be replaced with auth routes
  // These will be deprecated in favor of the /api/auth/* routes
  app.post("/api/users/register", userController.register);
  app.post("/api/users/login", userController.login);
  app.get("/api/users/profile", isAuthenticated, userController.getProfile);
  app.put("/api/users/profile", isAuthenticated, userController.updateProfile);
  
  // Auth routes
  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Remove sensitive data before sending to client
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  // New user profile routes
  app.get("/api/user/profile", isAuthenticated, (req, res) => {
    // The user object is already attached to req by the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // Remove sensitive data before sending to client
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Extract only the fields we want to allow updating
      const { fullName, phone, address, city, state, pincode } = req.body;
      const userData = { fullName, phone, address, city, state, pincode };
      
      // Update user in database
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Profile picture upload route
  // This would typically use multer or another middleware for handling file uploads
  app.post("/api/user/profile-picture", isAuthenticated, async (req, res) => {
    try {
      // In a real implementation, we would:
      // 1. Use multer to handle the file upload
      // 2. Store the file in a cloud storage service or local filesystem
      // 3. Update the user profile with the file URL
      
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // For now, we'll simulate a successful upload with a placeholder URL
      const userId = (req.user as any).id;
      const profilePictureUrl = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`;
      
      const updatedUser = await storage.updateUser(userId, {
        profilePicture: profilePictureUrl
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile picture" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });
  
  // Order routes
  app.get("/api/orders", isAdmin, orderController.getAllOrders);
  
  // Current authenticated user's orders
  app.get("/api/orders/user", (req, res) => {
    // This now uses a dedicated method that checks authentication internally
    return orderController.getCurrentUserOrders(req, res);
  });
  
  // Get orders for a specific user (admin or the user themselves)
  app.get("/api/orders/user/:userId", isAuthenticated, orderController.getOrdersByUser);
  
  // Get a specific order by ID
  // This must come after the /api/orders/user routes to avoid route conflicts
  app.get("/api/orders/:id", isAuthenticated, orderController.getOrderById);
  
  // Create a new order
  app.post("/api/orders", orderController.createOrder);
  
  // Update order status (admin only)
  app.put("/api/orders/:id/status", isAdmin, orderController.updateOrderStatus);

  // Delivery routes
  app.post("/api/delivery/create-shipment", isAdmin, async (req, res) => {
    try {
      const shipmentRequest = req.body;
      const result = await deliveryService.createShipment(shipmentRequest);
      res.json(result);
    } catch (error) {
      console.error("Error creating shipment:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  app.get("/api/delivery/track/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const result = await deliveryService.getTrackingInfo(trackingId);
      res.json(result);
    } catch (error) {
      console.error("Error getting tracking info:", error);
      res.status(500).json({ error: "Failed to get tracking information" });
    }
  });

  app.post("/api/orders/:id/create-shipment", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(parseInt(id));
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const user = await storage.getUsers().then(users => users.find(u => u.id === order.userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const orderItems = await storage.getOrderItems(parseInt(id));
      const { DeliveryService } = await import('./services/delivery');
      const shipmentRequest = DeliveryService.orderToDeliveryRequest(order, user, orderItems);
      const result = await deliveryService.createShipment(shipmentRequest);
      
      if (result.success && result.trackingId) {
        // Update order with tracking information
        await storage.updateOrderTracking(parseInt(id), result.trackingId, result.trackingUrl);
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error creating shipment for order:", error);
      res.status(500).json({ error: "Failed to create shipment for order" });
    }
  });

  // Invoice upload and download routes
  app.post("/api/invoices/upload", isAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getInvoiceUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting invoice upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/orders/:id/invoice", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { invoiceUrl } = req.body;
      
      if (!invoiceUrl) {
        return res.status(400).json({ error: "Invoice URL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeInvoicePath(invoiceUrl);
      
      const updatedOrder = await storage.updateOrderInvoice(parseInt(id), normalizedPath);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Serve uploaded invoice files
  app.get("/invoices/:invoicePath(*)", async (req, res) => {
    try {
      const invoicePath = req.params.invoicePath;
      const objectStorageService = new ObjectStorageService();
      
      // Get the invoice file from object storage
      const invoiceFile = await objectStorageService.getInvoiceFile(`/invoices/${invoicePath}`);
      
      if (!invoiceFile) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Stream the file to the response
      objectStorageService.downloadObject(invoiceFile, res);
    } catch (error) {
      console.error("Error serving invoice:", error);
      return res.status(500).json({ error: "Failed to serve invoice" });
    }
  });

  app.get("/api/invoices/download/invoices/:invoiceId(*)", isAdmin, async (req, res) => {
    try {
      const invoicePath = `/invoices/${req.params.invoiceId}`;
      const objectStorageService = new ObjectStorageService();
      const invoiceFile = await objectStorageService.getInvoiceFile(invoicePath);
      
      await objectStorageService.downloadObject(invoiceFile, res);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.status(500).json({ error: "Failed to download invoice" });
    }
  });
  
  // Payment routes
  // For testing purposes, we're temporarily removing authentication check
  app.post("/api/payment/create-order", paymentController.createOrder);
  app.post("/api/payment/verify", paymentController.verifyPayment);
  app.post("/api/payment/process-cod", paymentController.processCodOrder);
  
  // Chatbot route
  app.post("/api/chatbot", chatbotController.processMessage);
  
  // Category routes
  app.get("/api/categories", categoryController.getAllCategories);
  app.get("/api/categories/slug/:slug", categoryController.getCategoryBySlug);
  app.get("/api/categories/:id", categoryController.getCategoryById);
  app.get("/api/categories/:id/subcategories", categoryController.getSubcategories);
  app.get("/api/categories/:id/products", categoryController.getCategoryProducts);
  app.post("/api/categories", isAdmin, categoryController.createCategory);
  app.put("/api/categories/:id", isAdmin, categoryController.updateCategory);
  app.delete("/api/categories/:id", isAdmin, categoryController.deleteCategory);
  
  // Users management routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      // Get data from request body
      const { username, password, email, fullName, phone, isAdmin: isUserAdmin } = req.body;
      
      // Log the received data for debugging
      console.log("Creating new user with data:", {
        username,
        email,
        fullName,
        phone,
        isAdmin: isUserAdmin
      });
      
      // Basic validation
      if (!username || !password || !email || !fullName) {
        console.log("Missing required fields");
        return res.status(400).json({ message: "Required fields missing" });
      }
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        console.log("Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        console.log("Email already exists");
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password before storing
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);
      
      // Create the user with all required fields from the schema
      const userData = {
        username,
        password: hashedPassword,
        email,
        fullName,
        phone: phone || '',
        address: '', // Default empty values for required fields
        city: '',
        state: '',
        pincode: '',
        isAdmin: isUserAdmin || false,
        isActive: true, // New users are active by default
        isGoogleUser: false,
        isFacebookUser: false,
        emailVerified: true, // Auto-verify admin-created accounts
        googleId: null,
        facebookId: null,
        profilePicture: null
      };
      
      console.log("Creating user with:", userData);
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      console.log("User created successfully:", userWithoutPassword);
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: (error as any).message });
    }
  });
  
  app.put("/api/users/:id/status", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      console.log(`Updating user ${userId} status to isActive=${isActive}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Update just the isActive status
      const updatedUser = await storage.updateUser(userId, { isActive });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`User status updated successfully for user ${userId}`);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status", error: (error as any).message });
    }
  });
  
  // Admin data routes
  app.get("/api/admin/dashboard/stats", isAdmin, adminController.getDashboardStats);
  app.get("/api/admin/dashboard/recent-orders", isAdmin, adminController.getRecentOrders);
  app.get("/api/admin/dashboard/top-products", isAdmin, adminController.getTopProducts);
  
  // Navbar settings routes
  app.get("/api/navbar-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getNavbarSettings();
      res.json(settings || { logoImage: "/src/assets/blinkeach-logo.jpg", redirectLink: "/" });
    } catch (error) {
      console.error("Error fetching navbar settings:", error);
      res.status(500).json({ error: "Failed to fetch navbar settings" });
    }
  });

  app.put("/api/navbar-settings", isAdmin, upload.single('logoImage'), async (req: Request, res: Response) => {
    try {
      const { redirectLink } = req.body;
      let logoImage = req.body.logoImage;

      // If a new image was uploaded, use the uploaded file path
      if (req.file) {
        logoImage = `/uploads/${req.file.filename}`;
      }

      const settings = await storage.updateNavbarSettings({
        logoImage,
        redirectLink: redirectLink || "/"
      });

      res.json(settings);
    } catch (error) {
      console.error("Error updating navbar settings:", error);
      res.status(500).json({ error: "Failed to update navbar settings" });
    }
  });
  
  // File upload routes
  app.post("/api/uploads/images", isAdmin, upload.single('image'), uploadController.uploadImage);
  app.post("/api/uploads/multiple-images", isAdmin, upload.array('images', 10), uploadController.uploadMultipleImages);
  app.post("/api/uploads/model3d", isAdmin, upload3d.single('model'), uploadController.upload3dModel);
  
  // Support routes
  app.post("/api/support/callback-request", supportController.submitCallbackRequest);
  app.post("/api/support/email", supportController.submitSupportEmail);
  app.get("/api/support/requests", isAdmin, supportController.getActiveSupportRequests);
  app.put("/api/support/requests/:id/status", isAdmin, supportController.updateSupportRequestStatus);
  
  // Contact routes
  app.post("/api/contact", contactController.submitContactMessage);
  app.get("/api/contact/messages", isAdmin, contactController.getContactMessages);
  app.get("/api/contact/me", isAdmin, contactController.getContactMessages); // Add this as an alias for messages endpoint
  app.put("/api/contact/messages/:id/status", isAdmin, contactController.updateMessageStatus);
  
  // Cart routes
  app.get("/api/cart", isAuthenticated, cartController.getCartItems);
  app.post("/api/cart", isAuthenticated, cartController.addToCart);
  app.put("/api/cart/:id", isAuthenticated, cartController.updateCartItemQuantity);
  app.delete("/api/cart/:id", isAuthenticated, cartController.removeFromCart);
  app.delete("/api/cart", isAuthenticated, cartController.clearCart);
  
  // Wishlist routes
  app.get("/api/wishlist", isAuthenticated, wishlistController.getUserWishlist);
  app.post("/api/wishlist", isAuthenticated, wishlistController.addToWishlist);
  app.delete("/api/wishlist/:productId", isAuthenticated, wishlistController.removeFromWishlist);
  app.get("/api/wishlist/check/:productId", isAuthenticated, wishlistController.checkWishlistStatus);
  
  // Review routes
  app.get("/api/products/:productId/reviews", reviewController.getProductReviews);
  app.get("/api/reviews/user", isAuthenticated, reviewController.getUserReviews);
  app.post("/api/reviews", isAuthenticated, reviewController.submitReview);
  app.put("/api/reviews/:id", isAuthenticated, reviewController.updateReview);
  app.delete("/api/reviews/:id", isAuthenticated, reviewController.deleteReview);
  app.get("/api/products/:productId/can-review", isAuthenticated, reviewController.canReviewProduct);
  
  // Return request routes
  app.get("/api/returns", isAdmin, returnController.getAllReturnRequests);
  app.get("/api/returns/user", isAuthenticated, returnController.getUserReturnRequests);
  app.get("/api/orders/:orderId/return-eligibility", isAuthenticated, returnController.checkReturnEligibility);
  app.post("/api/returns", isAuthenticated, returnController.submitReturnRequest);
  app.put("/api/returns/:id/approve", isAdmin, returnController.approveReturnRequest);
  app.put("/api/returns/:id/reject", isAdmin, returnController.rejectReturnRequest);
  app.post("/api/returns/upload-images", isAuthenticated, upload.array('images', 3), returnController.uploadReturnImages);
  
  // User Address routes
  app.get("/api/user/addresses", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const addresses = await storage.getUserAddresses(userId);
      
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });
  
  app.get("/api/user/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);
      
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      const address = await storage.getUserAddressById(addressId);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Security check - ensure user can only access their own addresses
      if (address.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(address);
    } catch (error) {
      console.error("Error fetching user address:", error);
      res.status(500).json({ message: "Failed to fetch address" });
    }
  });
  
  app.post("/api/user/addresses", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      
      // Extract address details from request body
      const { 
        addressName,
        fullName, 
        phone, 
        address, 
        city, 
        state, 
        pincode, 
        isDefault
      } = req.body;
      
      // Basic validation
      if (!addressName || !fullName || !phone || !address || !city || !state || !pincode) {
        return res.status(400).json({ message: "Required fields missing" });
      }
      
      // Create the address
      const addressData = {
        userId,
        addressName,
        fullName,
        phone,
        address,
        city,
        state,
        pincode,
        isDefault: isDefault || false
      };
      
      const createdAddress = await storage.createUserAddress(addressData);
      
      res.status(201).json(createdAddress);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });
  
  app.put("/api/user/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);
      
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Check if address exists and belongs to user
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Security check - ensure user can only update their own addresses
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Extract address details from request body
      const { 
        addressName,
        fullName, 
        phone, 
        address,
        city, 
        state, 
        pincode,
        isDefault
      } = req.body;
      
      // Collect fields to update (only include provided fields)
      const addressData: Partial<typeof existingAddress> = {};
      
      if (addressName !== undefined) addressData.addressName = addressName;
      if (fullName !== undefined) addressData.fullName = fullName;
      if (phone !== undefined) addressData.phone = phone;
      if (address !== undefined) addressData.address = address;
      if (city !== undefined) addressData.city = city;
      if (state !== undefined) addressData.state = state;
      if (pincode !== undefined) addressData.pincode = pincode;
      if (isDefault !== undefined) addressData.isDefault = isDefault;
      
      // Update the address
      const updatedAddress = await storage.updateUserAddress(addressId, addressData);
      
      if (!updatedAddress) {
        return res.status(500).json({ message: "Failed to update address" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });
  
  app.delete("/api/user/addresses/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);
      
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Check if address exists and belongs to user
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Security check - ensure user can only delete their own addresses
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the address
      const success = await storage.deleteUserAddress(addressId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete address" });
      }
      
      res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });
  
  app.post("/api/user/addresses/:id/default", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = (req.user as any).id;
      const addressId = parseInt(req.params.id);
      
      if (isNaN(addressId)) {
        return res.status(400).json({ message: "Invalid address ID" });
      }
      
      // Check if address exists and belongs to user
      const existingAddress = await storage.getUserAddressById(addressId);
      
      if (!existingAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      // Security check - ensure user can only modify their own addresses
      if (existingAddress.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Set as default address
      const success = await storage.setDefaultUserAddress(userId, addressId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to set default address" });
      }
      
      res.json({ success: true, message: "Default address updated successfully" });
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ message: "Failed to set default address" });
    }
  });
  
  // Referral system routes
  app.get("/api/referral", isAuthenticated, referralController.getUserReferralCode);
  app.post("/api/referral", isAuthenticated, referralController.createReferralCode);
  app.get("/api/referral/validate/:code", referralController.validateReferralCode);
  app.get("/api/referral/rewards", isAuthenticated, referralController.getUserRewards);
  app.put("/api/referral/rewards/:id/process", isAdmin, referralController.processReward);
  
  // Social analytics routes
  app.use("/api/social", socialRoutes);
  
  // Placeholder image endpoint
  app.get('/api/placeholder-image', (req, res) => {
    // Create a simple SVG placeholder image
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="300" fill="#f3f4f6"/>
        <text x="150" y="150" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
          Product Image
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(svg);
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket chat server
  new ChatServer(httpServer);
  
  return httpServer;
}
