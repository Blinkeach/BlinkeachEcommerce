import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  pincode: text("pincode").notNull().default(""),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  profilePicture: text("profile_picture"),
  isGoogleUser: boolean("is_google_user").notNull().default(false),
  isFacebookUser: boolean("is_facebook_user").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Addresses table - to store multiple addresses per user
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  addressName: text("address_name").notNull(), // e.g., "Home", "Office", "Mom's House"
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  parent_id: integer("parent_id"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in paise/paisa (1/100 of a rupee)
  originalPrice: integer("original_price"), // for displaying discounted prices
  stock: integer("stock").notNull().default(0),
  quantityUnit: text("quantity_unit").notNull().default("pcs"), // Unit of measurement: kg, pcs, count, etc.
  quantityPerUnit: doublePrecision("quantity_per_unit").notNull().default(1), // Number of units (e.g., 1 kg, 5 pcs)
  category: text("category").notNull(), // Category name (compatibility with existing data)
  hsnCode: text("hsn_code"), // HSN (Harmonized System of Nomenclature) code for tax purposes
  igst: doublePrecision("igst").notNull().default(0), // Integrated GST rate
  sgst: doublePrecision("sgst").notNull().default(0), // State/UT GST rate
  cgst: doublePrecision("cgst").notNull().default(0), // Central GST rate
  images: json("images").$type<string[]>().notNull(),
  highlights: json("highlights").$type<string[]>(),
  specifications: json("specifications").$type<Record<string, string>>(),
  rating: doublePrecision("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  // Basic product info - variants will be stored separately
  hasVariants: boolean("has_variants").notNull().default(false),
  // 3D model data
  model3d: json("model_3d").$type<{url?: string, type?: string, scale?: number}>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product Variants table - for tracking individual color-size combinations
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  colorName: text("color_name").notNull(),
  colorValue: text("color_value").notNull(), // hex color code
  sizeName: text("size_name").notNull(),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"), // Stock Keeping Unit for this specific variant
  images: json("images").$type<string[]>().default([]), // Images specific to this color-size combo
  price: integer("price"), // Optional: variant-specific pricing
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure unique combinations of product, color, and size
  uniqueVariant: unique().on(table.productId, table.colorName, table.sizeName),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, out_for_delivery, delivered, cancelled
  totalAmount: integer("total_amount").notNull(), // in paise/paisa
  shippingAddress: text("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  specialInstructions: text("special_instructions"),
  userName: text("user_name"),
  userEmail: text("user_email"),
  userPhone: text("user_phone"),
  invoiceUrl: text("invoice_url"), // URL path to uploaded invoice file
  trackingId: text("tracking_id"), // Delivery tracking ID from courier
  trackingUrl: text("tracking_url"), // Tracking URL for customer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in paise/paisa
  quantity: integer("quantity").notNull(),
  selectedColor: text("selected_color"),
  selectedSize: text("selected_size"),
  hsnCode: text("hsn_code"),
  productImage: text("product_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  selectedColor: text("selected_color"),
  selectedSize: text("selected_size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Return requests table
export const returnRequests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  userId: integer("user_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: text("pickup_city").notNull(),
  pickupState: text("pickup_state").notNull(),
  pickupPincode: text("pickup_pincode").notNull(),
  pickupPhone: text("pickup_phone").notNull(),
  isSameAsDelivery: boolean("is_same_as_delivery").notNull().default(true),
  images: json("images").$type<string[]>(),
  videoUrl: text("video_url"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral system tables
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  referralCode: text("referral_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  amount: integer("amount").notNull(), // In paise (40 rupees = 4000 paise)
  status: text("status").notNull().default("pending"), // pending, processed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Wishlist table
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Now set up all the relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  reviews: many(reviews),
  addresses: many(userAddresses),
  referrals: many(referrals),
  wishlistItems: many(wishlistItems),
  receivedRewards: many(referralRewards, { relationName: "receivedRewards" }),
  givenRewards: many(referralRewards, { relationName: "givenRewards" })
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: "subCategories"
  }),
  subCategories: many(categories, { relationName: "subCategories" })
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  reviews: many(reviews),
  variants: many(productVariants),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const returnRequestsRelations = relations(returnRequests, ({ one }) => ({
  order: one(orders, {
    fields: [returnRequests.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [returnRequests.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  user: one(users, {
    fields: [referrals.userId],
    references: [users.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));



export const referralRewardsRelations = relations(referralRewards, ({ one }) => ({
  referrer: one(users, {
    fields: [referralRewards.referrerId],
    references: [users.id],
    relationName: "receivedRewards",
  }),
  referred: one(users, {
    fields: [referralRewards.referredId],
    references: [users.id],
    relationName: "givenRewards",
  }),
  order: one(orders, {
    fields: [referralRewards.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  isAdmin: true,
  isActive: true,
  profilePicture: true,
  isGoogleUser: true,
  isFacebookUser: true,
  emailVerified: true,
  googleId: true,
  facebookId: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  image: true,
  parent_id: true,
  isActive: true,
  displayOrder: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  originalPrice: true,
  stock: true,
  category: true,
  hsnCode: true,
  images: true,
  highlights: true,
  specifications: true,
  hasVariants: true,
  model3d: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).pick({
  productId: true,
  colorName: true,
  colorValue: true,
  sizeName: true,
  stock: true,
  sku: true,
  images: true,
  price: true,
  isActive: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  totalAmount: true,
  shippingAddress: true,
  paymentMethod: true,
  specialInstructions: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  razorpaySignature: true,
  paymentId: true,
  userName: true,
  userEmail: true,
  userPhone: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  name: true,
  price: true,
  quantity: true,
  selectedColor: true,
  selectedSize: true,
  hsnCode: true,
  productImage: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  userId: true,
  productId: true,
  quantity: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  productId: true,
  userId: true,
  rating: true,
  title: true,
  comment: true,
  isVerifiedPurchase: true,
});

export const insertReturnRequestSchema = createInsertSchema(returnRequests).pick({
  orderId: true,
  userId: true,
  reason: true,
  details: true,
  pickupAddress: true,
  pickupCity: true,
  pickupState: true,
  pickupPincode: true,
  pickupPhone: true,
  isSameAsDelivery: true,
  images: true,
  videoUrl: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).pick({
  userId: true,
  addressName: true,
  fullName: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  isDefault: true,
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  userId: true,
  referralCode: true,
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).pick({
  userId: true,
  productId: true,
});

export const insertReferralRewardSchema = createInsertSchema(referralRewards).pick({
  referrerId: true,
  referredId: true,
  orderId: true,
  amount: true,
  status: true,
});

// Support Requests table
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "callback", "email", "chat"
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  preferredLanguage: text("preferred_language").default("english"),
  message: text("message"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // "pending", "completed", "cancelled"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).pick({
  type: true,
  name: true,
  phone: true,
  email: true,
  preferredLanguage: true,
  message: true,
  notes: true,
  status: true,
});

// Contact Messages table
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // "new", "read", "archived"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  phone: true,
  message: true,
  status: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export type ReturnRequest = typeof returnRequests.$inferSelect;
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;

export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = z.infer<typeof insertReferralRewardSchema>;

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

// Navbar Settings table
export const navbarSettings = pgTable("navbar_settings", {
  id: serial("id").primaryKey(),
  logoImage: text("logo_image").notNull(), // URL or path to the logo image
  redirectLink: text("redirect_link").notNull().default("/"), // Link when logo is clicked
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNavbarSettingsSchema = createInsertSchema(navbarSettings).pick({
  logoImage: true,
  redirectLink: true,
  isActive: true,
});

export type NavbarSettings = typeof navbarSettings.$inferSelect;
export type InsertNavbarSettings = z.infer<typeof insertNavbarSettingsSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;