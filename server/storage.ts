import { 
  users, products, orders, orderItems, 
  cartItems, reviews, categories, userAddresses, returnRequests,
  referrals, referralRewards, supportRequests, wishlistItems, navbarSettings,
  productVariants,
  User, InsertUser, 
  Product, InsertProduct, 
  Order, InsertOrder, 
  OrderItem, InsertOrderItem, 
  CartItem, InsertCartItem,
  Category, InsertCategory,
  Review, InsertReview,
  UserAddress, InsertUserAddress,
  ReturnRequest, InsertReturnRequest,
  Referral, InsertReferral,
  ReferralReward, InsertReferralReward,
  SupportRequest, InsertSupportRequest,
  WishlistItem, InsertWishlistItem,
  NavbarSettings, InsertNavbarSettings,
  ProductVariant, InsertProductVariant
} from "@shared/schema";
import { eq, ne, and, gte, desc, sql, or } from "drizzle-orm";
import session from "express-session";

export interface IStorage {
  sessionStore: session.Store;
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // User Address methods
  getUserAddresses(userId: number): Promise<UserAddress[]>;
  getUserAddressById(id: number): Promise<UserAddress | undefined>;
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: number, addressData: Partial<UserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(id: number): Promise<boolean>;
  setDefaultUserAddress(userId: number, addressId: number): Promise<boolean>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getSubcategories(parentId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Product methods
  getProducts(filters?: { category?: string, search?: string, minPrice?: number, maxPrice?: number, sortBy?: string }): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsByCategoryId(categoryId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getTopSellingProducts(limit: number): Promise<Product[]>;
  getDeals(limit: number): Promise<Product[]>;
  searchProductSuggestions(query: string): Promise<Array<{ id: number; name: string; price: number; images: string[]; category: string }>>;
  
  // Product Variant methods
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  getProductVariantById(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: number, variantData: Partial<ProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: number): Promise<boolean>;
  deleteProductVariants(productId: number): Promise<boolean>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderInvoice(id: number, invoiceUrl: string): Promise<Order | undefined>;
  
  // Order Items methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Cart methods
  getCartItems(userId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  updateCartItem(id: number, updates: { quantity?: number; selectedColor?: string; selectedSize?: string }): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Review methods
  getProductReviews(productId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;
  getReviewById(id: number): Promise<Review | undefined>;
  addReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Return Request methods
  getAllReturnRequests(): Promise<ReturnRequest[]>;
  getUserReturnRequests(userId: number): Promise<ReturnRequest[]>;
  getReturnRequestById(id: number): Promise<ReturnRequest | undefined>;
  getReturnRequestByOrderId(orderId: number): Promise<ReturnRequest | undefined>;
  createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest>;
  updateReturnRequest(id: number, returnData: Partial<ReturnRequest>): Promise<ReturnRequest | undefined>;
  
  // Referral methods
  getUserReferral(userId: number): Promise<Referral | undefined>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  
  // Referral Rewards methods
  getUserReceivedRewards(userId: number): Promise<ReferralReward[]>;
  checkHasReceivedReward(userId: number): Promise<boolean>;
  createReferralReward(reward: InsertReferralReward): Promise<ReferralReward>;
  updateReferralRewardStatus(id: number, status: string): Promise<ReferralReward | undefined>;
  
  // Support Request methods
  getAllSupportRequests(): Promise<SupportRequest[]>;
  getSupportRequestById(id: number): Promise<SupportRequest | undefined>;
  getSupportRequestsByStatus(status: string): Promise<SupportRequest[]>;
  createSupportRequest(supportRequest: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequestStatus(id: number, status: string): Promise<SupportRequest | undefined>;
  
  // Wishlist methods
  getUserWishlist(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  getWishlistItem(userId: number, productId: number): Promise<WishlistItem | undefined>;
  addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: number, productId: number): Promise<boolean>;
  
  // Navbar Settings methods
  getNavbarSettings(): Promise<NavbarSettings | undefined>;
  updateNavbarSettings(settings: InsertNavbarSettings): Promise<NavbarSettings>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cartItems: Map<number, CartItem>;
  private userAddresses: Map<number, UserAddress>;
  private currentUserId: number;
  private currentProductId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentCartItemId: number;
  private currentUserAddressId: number;

  constructor() {
    // Set up simple memory session store
    this.sessionStore = new session.MemoryStore();
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cartItems = new Map();
    this.userAddresses = new Map();
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentCartItemId = 1;
    this.currentUserAddressId = 1;
    
    // Initialize with an admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@blinkeach.com",
      fullName: "Admin User",
      isAdmin: true
    });

    // Add some initial products
    this.seedProducts();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      lastLogin: now,
      profilePicture: insertUser.profilePicture || null,
      isGoogleUser: insertUser.isGoogleUser || false,
      isFacebookUser: insertUser.isFacebookUser || false,
      googleId: insertUser.googleId || null,
      facebookId: insertUser.facebookId || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Product methods
  async getProducts(filters?: { 
    category?: string, 
    search?: string, 
    minPrice?: number, 
    maxPrice?: number,
    sortBy?: string 
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters) {
      // Filter by category
      if (filters.category) {
        // Map URL-friendly category names to database category names
        const categoryMap: { [key: string]: string } = {
          'home': 'Home',
          'home-office': 'Home & Office',
          'arts-craft': 'Arts & Craft',
          'electronics': 'Electronics',
          'fashion': 'Fashion',
          'appliances': 'Appliances',
          'toy': 'Toy',
          'toys': 'Toys',
          'laptops': 'Laptops',
          'smartphones': 'Smartphones'
        };
        
        const dbCategory = categoryMap[filters.category.toLowerCase()] || filters.category;
        products = products.filter(p => 
          p.category.toLowerCase() === dbCategory.toLowerCase()
        );
      }
      
      // Filter by search term
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by price range
      if (filters.minPrice !== undefined) {
        products = products.filter(p => p.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        products = products.filter(p => p.price <= filters.maxPrice!);
      }
      
      // Sort products
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-low-high':
            products.sort((a, b) => a.price - b.price);
            break;
          case 'price-high-low':
            products.sort((a, b) => b.price - a.price);
            break;
          case 'newest':
            products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            break;
          case 'rating':
            products.sort((a, b) => b.rating - a.rating);
            break;
          default:
            break;
        }
      }
    }
    
    return products;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { 
      ...insertProduct, 
      id, 
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { 
      ...product, 
      ...productData,
      updatedAt: new Date()
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getTopSellingProducts(limit: number): Promise<Product[]> {
    // In a real database this would be determined by order history
    // Here we'll just return products with highest rating
    return Array.from(this.products.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  async getDeals(limit: number): Promise<Product[]> {
    // Return products with biggest price difference (original vs current)
    return Array.from(this.products.values())
      .filter(p => p.originalPrice && p.originalPrice > p.price)
      .sort((a, b) => {
        const discountA = a.originalPrice! - a.price;
        const discountB = b.originalPrice! - b.price;
        return discountB - discountA;
      })
      .slice(0, limit);
  }

  async searchProductSuggestions(query: string): Promise<Array<{ id: number; name: string; price: number; images: string[]; category: string }>> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.products.values())
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, 8) // Limit to 8 suggestions
      .map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category
      }));
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const order: Order = { 
      ...insertOrder, 
      id, 
      status: "pending",
      paymentId: "",
      razorpayOrderId: "",
      razorpayPaymentId: "",
      razorpaySignature: "",
      createdAt: now,
      updatedAt: now 
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      status,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderInvoice(id: number, invoiceUrl: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      invoiceUrl,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order Items methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  async addOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const now = new Date();
    const orderItem: OrderItem = { 
      ...insertOrderItem, 
      id, 
      createdAt: now,
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
  }

  async addCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const now = new Date();
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedItem = { 
      ...cartItem, 
      quantity,
      updatedAt: new Date()
    };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async updateCartItem(id: number, updates: { quantity?: number; selectedColor?: string; selectedSize?: string }): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedItem = { 
      ...cartItem, 
      ...updates,
      updatedAt: new Date()
    };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
    
    userCartItems.forEach(item => {
      this.cartItems.delete(item.id);
    });
    
    return true;
  }

  // User Address methods
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    return Array.from(this.userAddresses.values()).filter(
      (address) => address.userId === userId
    );
  }

  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    return this.userAddresses.get(id);
  }

  async createUserAddress(insertAddress: InsertUserAddress): Promise<UserAddress> {
    const id = this.currentUserAddressId++;
    const now = new Date();
    
    // If this is the first address for the user or isDefault is true, set it as default
    const existingAddresses = await this.getUserAddresses(insertAddress.userId);
    const isDefault = insertAddress.isDefault || existingAddresses.length === 0;
    
    // If we're setting this as default, update all other addresses to not be default
    if (isDefault) {
      existingAddresses.forEach(address => {
        if (address.isDefault) {
          this.updateUserAddress(address.id, { isDefault: false });
        }
      });
    }
    
    const userAddress: UserAddress = {
      ...insertAddress,
      id,
      isDefault,
      createdAt: now,
      updatedAt: now
    };
    
    this.userAddresses.set(id, userAddress);
    return userAddress;
  }

  async updateUserAddress(id: number, addressData: Partial<UserAddress>): Promise<UserAddress | undefined> {
    const address = this.userAddresses.get(id);
    if (!address) return undefined;
    
    const updatedAddress = {
      ...address,
      ...addressData,
      updatedAt: new Date()
    };
    
    // If we're setting this address as default, update all other addresses for the user
    if (addressData.isDefault) {
      const userAddresses = await this.getUserAddresses(address.userId);
      userAddresses.forEach(addr => {
        if (addr.id !== id && addr.isDefault) {
          this.userAddresses.set(addr.id, {
            ...addr,
            isDefault: false,
            updatedAt: new Date()
          });
        }
      });
    }
    
    this.userAddresses.set(id, updatedAddress);
    return updatedAddress;
  }

  async deleteUserAddress(id: number): Promise<boolean> {
    const address = this.userAddresses.get(id);
    if (!address) return false;
    
    // If we're deleting a default address, set another address as default (if any)
    if (address.isDefault) {
      const userAddresses = await this.getUserAddresses(address.userId);
      const otherAddresses = userAddresses.filter(addr => addr.id !== id);
      
      if (otherAddresses.length > 0) {
        this.updateUserAddress(otherAddresses[0].id, { isDefault: true });
      }
    }
    
    return this.userAddresses.delete(id);
  }

  async setDefaultUserAddress(userId: number, addressId: number): Promise<boolean> {
    const address = this.userAddresses.get(addressId);
    if (!address || address.userId !== userId) return false;
    
    // Clear default status from all other addresses
    const userAddresses = await this.getUserAddresses(userId);
    userAddresses.forEach(addr => {
      if (addr.id !== addressId && addr.isDefault) {
        this.userAddresses.set(addr.id, {
          ...addr,
          isDefault: false,
          updatedAt: new Date()
        });
      }
    });
    
    // Set this address as default
    this.userAddresses.set(addressId, {
      ...address,
      isDefault: true,
      updatedAt: new Date()
    });
    
    return true;
  }

  // Seed some initial products
  private seedProducts() {
    const categories = [
      "Smartphones", "Laptops", "Fashion", "Home", "Electronics", "Beauty"
    ];
    
    const smartphones = [
      {
        name: "OnePlus Nord CE 3 Lite 5G (8GB RAM, 128GB Storage)",
        description: "Experience lightning-fast 5G connectivity with the OnePlus Nord CE 3 Lite. Featuring a powerful Snapdragon processor, 8GB RAM, and 128GB storage, this smartphone delivers smooth performance for all your daily tasks. The stunning 6.7-inch display with 120Hz refresh rate provides fluid visuals, while the 64MP main camera captures every detail with clarity.",
        price: 1699900, // ₹16,999
        originalPrice: 2499900, // ₹24,999
        stock: 150,
        category: "Smartphones",
        images: [
          "https://images.unsplash.com/photo-1585060544812-6b45742d762f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
          "https://images.unsplash.com/photo-1605236453806-6ff36851218e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
        ],
        highlights: [
          "6.7-inch 120Hz display",
          "64MP main camera",
          "5000mAh battery with 33W charging",
          "Snapdragon processor",
          "OxygenOS based on Android 13"
        ],
        specifications: {
          "Display": "6.7-inch FHD+ LCD with 120Hz refresh rate",
          "Processor": "Qualcomm Snapdragon 695",
          "RAM": "8GB LPDDR4X",
          "Storage": "128GB UFS 2.2",
          "Battery": "5000mAh with 33W SuperVOOC charging",
          "Rear Camera": "64MP main + 2MP macro + 2MP depth",
          "Front Camera": "16MP",
          "OS": "OxygenOS based on Android 13",
          "SIM Type": "Dual SIM (nano + nano)",
          "Connectivity": "5G, Wi-Fi 802.11, Bluetooth 5.1, GPS"
        },
        rating: 4.5,
        reviewCount: 2345
      },
      {
        name: "iPhone 13 (128GB, Blue)",
        description: "The iPhone 13 features a powerful A15 Bionic chip, advanced dual-camera system, and Super Retina XDR display. With 128GB of storage, you have ample space for apps, photos, and videos. The sleek blue finish gives it a premium look and feel.",
        price: 5999900, // ₹59,999
        originalPrice: 6999900, // ₹69,999
        stock: 75,
        category: "Smartphones",
        images: [
          "https://images.unsplash.com/photo-1607936854279-55e8a4c64888?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "A15 Bionic chip",
          "Super Retina XDR display",
          "Advanced dual-camera system",
          "Ceramic Shield",
          "128GB storage"
        ],
        specifications: {
          "Display": "6.1-inch Super Retina XDR display",
          "Processor": "A15 Bionic chip",
          "Storage": "128GB",
          "Rear Camera": "Dual 12MP camera system",
          "Front Camera": "12MP TrueDepth front camera",
          "Battery": "Up to 19 hours video playback",
          "OS": "iOS 15",
          "Water Resistance": "IP68"
        },
        rating: 4.8,
        reviewCount: 3654
      }
    ];
    
    const electronics = [
      {
        name: "Fire-Boltt Ninja Smart Watch with Bluetooth Calling",
        description: "Stay connected on the go with the Fire-Boltt Ninja smart watch. Make and receive calls directly from your wrist, track your fitness metrics, and monitor your heart rate. The large 1.7-inch display provides clear visibility of all your notifications.",
        price: 199900, // ₹1,999
        originalPrice: 349900, // ₹3,499
        stock: 200,
        category: "Electronics",
        images: [
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Bluetooth calling",
          "1.7-inch display",
          "Heart rate monitoring",
          "Multiple sports modes",
          "Water resistant"
        ],
        specifications: {
          "Display": "1.7-inch color display",
          "Connectivity": "Bluetooth 5.0",
          "Battery": "Up to 7 days standby time",
          "Water Resistance": "IP67",
          "Sports Modes": "Multiple sports tracking modes",
          "Sensors": "Heart rate, SpO2"
        },
        rating: 4.0,
        reviewCount: 1234
      },
      {
        name: "boAt Rockerz 450 Bluetooth On-Ear Headphones",
        description: "Immerse yourself in high-quality sound with the boAt Rockerz 450 on-ear headphones. The soft padded ear cushions provide comfort during long listening sessions, while the foldable design makes it easy to carry. With up to 15 hours of playtime, enjoy your music all day long.",
        price: 149900, // ₹1,499
        originalPrice: 299900, // ₹2,999
        stock: 300,
        category: "Electronics",
        images: [
          "https://images.unsplash.com/photo-1600086827875-a63b01f5aff7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Up to 15 hours playtime",
          "40mm dynamic drivers",
          "Soft padded ear cushions",
          "Foldable design",
          "Bluetooth v4.2"
        ],
        specifications: {
          "Driver Size": "40mm dynamic drivers",
          "Connectivity": "Bluetooth v4.2",
          "Battery": "Up to 15 hours playtime",
          "Charging Time": "2.5 hours",
          "Frequency": "20Hz-20KHz",
          "Impedance": "32Ω"
        },
        rating: 4.5,
        reviewCount: 3421
      },
      {
        name: "JBL Flip 5 Waterproof Portable Bluetooth Speaker",
        description: "Take your music anywhere with the JBL Flip 5 portable Bluetooth speaker. Its waterproof design makes it perfect for pool parties and beach days. The powerful bass radiators deliver deep, punchy sound, while the 12-hour battery life ensures the party keeps going.",
        price: 849900, // ₹8,499
        originalPrice: 1199900, // ₹11,999
        stock: 120,
        category: "Electronics",
        images: [
          "https://images.unsplash.com/photo-1596460107916-430662021049?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Waterproof design (IPX7)",
          "12 hours of playtime",
          "Powerful JBL signature sound",
          "PartyBoost feature",
          "USB-C charging"
        ],
        specifications: {
          "Output Power": "20W RMS",
          "Battery": "Up to 12 hours playtime",
          "Charging Time": "2.5 hours",
          "Bluetooth": "Bluetooth 4.2",
          "Waterproof": "IPX7 (can be submerged in water)",
          "Dimensions": "18.1 x 7.4 x 6.9 cm"
        },
        rating: 5.0,
        reviewCount: 2876
      }
    ];
    
    const fashion = [
      {
        name: "Campus Men's Running Shoes - Lightweight & Comfortable",
        description: "Step up your fitness game with these lightweight running shoes from Campus. The breathable mesh upper keeps your feet cool, while the cushioned sole provides comfort for long runs. The stylish design makes them perfect for both workouts and casual wear.",
        price: 89900, // ₹899
        originalPrice: 149900, // ₹1,499
        stock: 250,
        category: "Fashion",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Lightweight design",
          "Breathable mesh upper",
          "Cushioned sole",
          "Non-slip outsole",
          "Stylish look"
        ],
        specifications: {
          "Material": "Mesh, Synthetic",
          "Sole": "Rubber",
          "Closure": "Lace-up",
          "Weight": "Lightweight",
          "Usage": "Running, Casual Wear"
        },
        rating: 3.5,
        reviewCount: 987
      },
      {
        name: "Premium Cotton Socks (Pack of 6) - Multicolor",
        description: "Keep your feet comfortable all day with these premium cotton socks. Made from soft, breathable cotton, they provide excellent moisture absorption and ventilation. The pack includes 6 pairs in different colors to match your daily outfits.",
        price: 39900, // ₹399
        originalPrice: 69900, // ₹699
        stock: 500,
        category: "Fashion",
        images: [
          "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Pack of 6 pairs",
          "Soft cotton material",
          "Moisture-wicking",
          "Reinforced heel and toe",
          "Multiple colors"
        ],
        specifications: {
          "Material": "80% Cotton, 15% Polyester, 5% Spandex",
          "Size": "Free Size (fits 8-11 UK)",
          "Pattern": "Solid Colors",
          "Care": "Machine Washable"
        },
        rating: 4.5,
        reviewCount: 2187
      }
    ];
    
    const home = [
      {
        name: "Prestige Iris 750W Mixer Grinder with 3 Stainless Steel Jars",
        description: "Make cooking easier with the Prestige Iris mixer grinder. The powerful 750W motor can handle tough ingredients with ease. The set includes 3 stainless steel jars for different purposes - grinding, blending, and chutney making. The ergonomic design ensures comfortable grip during use.",
        price: 279900, // ₹2,799
        originalPrice: 399900, // ₹3,999
        stock: 150,
        category: "Home",
        images: [
          "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "750W powerful motor",
          "3 stainless steel jars",
          "Ergonomic design",
          "Overload protection",
          "2-year warranty"
        ],
        specifications: {
          "Motor": "750W",
          "Jars": "1.5L liquidizing jar, 1L dry grinding jar, 0.4L chutney jar",
          "Material": "Stainless Steel",
          "Speed": "3 speed settings with incher",
          "Power": "220-240V, 50Hz",
          "Warranty": "2 years"
        },
        rating: 4.5,
        reviewCount: 3789
      }
    ];
    
    const gaming = [
      {
        name: "PlayStation 5 DualSense Wireless Controller",
        description: "Elevate your gaming experience with the PlayStation 5 DualSense wireless controller. The haptic feedback and adaptive triggers create immersive gameplay, while the built-in microphone allows you to chat with friends without a headset. The ergonomic design ensures comfort during long gaming sessions.",
        price: 599900, // ₹5,999
        originalPrice: 699900, // ₹6,999
        stock: 80,
        category: "Electronics",
        images: [
          "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
        ],
        highlights: [
          "Haptic feedback",
          "Adaptive triggers",
          "Built-in microphone",
          "Create button",
          "USB-C charging"
        ],
        specifications: {
          "Connectivity": "Bluetooth, USB-C",
          "Battery": "Built-in rechargeable battery",
          "Features": "Haptic feedback, adaptive triggers, motion sensor",
          "Compatibility": "PlayStation 5",
          "Color": "White"
        },
        rating: 5.0,
        reviewCount: 4567
      }
    ];
    
    // Add all products to the store
    [...smartphones, ...electronics, ...fashion, ...home, ...gaming].forEach(p => {
      this.createProduct(p as InsertProduct);
    });
  }
}

import { pool, db } from './db';
import { like, lte, asc } from 'drizzle-orm';
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Review methods implementation
  async getProductReviews(productId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }
  
  async getReviewById(id: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id));
    return review;
  }

  async addReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        ...review,
        createdAt: new Date()
      })
      .returning();
    return newReview;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set({
        ...reviewData,
        updatedAt: new Date()
      })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, id));
    return result.rowCount > 0;
  }
  
  // Return Request methods implementation
  async getAllReturnRequests(): Promise<ReturnRequest[]> {
    return await db
      .select()
      .from(returnRequests)
      .orderBy(desc(returnRequests.createdAt));
  }

  async getUserReturnRequests(userId: number): Promise<ReturnRequest[]> {
    return await db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.userId, userId))
      .orderBy(desc(returnRequests.createdAt));
  }

  async getReturnRequestById(id: number): Promise<ReturnRequest | undefined> {
    const [returnRequest] = await db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.id, id));
    return returnRequest;
  }

  async getReturnRequestByOrderId(orderId: number): Promise<ReturnRequest | undefined> {
    const [returnRequest] = await db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.orderId, orderId));
    return returnRequest;
  }

  async createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest> {
    const [newReturnRequest] = await db
      .insert(returnRequests)
      .values({
        ...returnRequest,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newReturnRequest;
  }

  async updateReturnRequest(id: number, returnData: Partial<ReturnRequest>): Promise<ReturnRequest | undefined> {
    const [updatedReturnRequest] = await db
      .update(returnRequests)
      .set({
        ...returnData,
        updatedAt: new Date()
      })
      .where(eq(returnRequests.id, id))
      .returning();
    return updatedReturnRequest;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async getSubcategories(parentId: number): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.parent_id, parentId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...categoryData,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result;
  }

  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      return [];
    }
    return this.getProductsByCategory(category.name);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Product methods
  async getProducts(filters?: { 
    category?: string, 
    search?: string, 
    minPrice?: number, 
    maxPrice?: number,
    sortBy?: string 
  }): Promise<Product[]> {
    let query = db.select().from(products);
    
    if (filters) {
      const conditions = [];
      
      // Filter by category (case-insensitive)
      if (filters.category) {
        // Map URL-friendly category names to database category names
        const categoryMap: { [key: string]: string } = {
          'home': 'Home',
          'home-office': 'Home & Office',
          'arts-craft': 'Arts & Craft',
          'electronics': 'Electronics',
          'fashion': 'Fashion',
          'appliances': 'Appliances',
          'toy': 'Toy',
          'toys': 'Toys',
          'laptops': 'Laptops',
          'smartphones': 'Smartphones'
        };
        
        const dbCategory = categoryMap[filters.category.toLowerCase()] || filters.category;
        conditions.push(eq(products.category, dbCategory));
      }
      
      // Filter by search term
      if (filters.search) {
        conditions.push(
          or(
            like(products.name, `%${filters.search}%`),
            like(products.description, `%${filters.search}%`)
          )
        );
      }
      
      // Filter by price range
      if (filters.minPrice !== undefined) {
        conditions.push(gte(products.price, filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(lte(products.price, filters.maxPrice));
      }
      
      // Apply all conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Sort products
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-low-high':
            query = query.orderBy(asc(products.price));
            break;
          case 'price-high-low':
            query = query.orderBy(desc(products.price));
            break;
          case 'newest':
            query = query.orderBy(desc(products.createdAt));
            break;
          case 'rating':
            query = query.orderBy(desc(products.rating));
            break;
          default:
            break;
        }
      }
    }
    
    return await query;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) return undefined;
    
    // Fetch variants for this product
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
    
    // Transform variants into color/size structure for frontend
    const colors: Array<{ name: string; value: string; images: string[] }> = [];
    const sizes: Array<{ name: string }> = [];
    
    variants.forEach(variant => {
      // Add unique colors
      if (!colors.find(c => c.name === variant.colorName)) {
        colors.push({
          name: variant.colorName,
          value: variant.colorValue,
          images: variant.images || []
        });
      }
      
      // Add unique sizes
      if (!sizes.find(s => s.name === variant.sizeName)) {
        sizes.push({
          name: variant.sizeName
        });
      }
    });
    
    return {
      ...product,
      variants,
      colors: colors.length > 0 ? colors : undefined,
      sizes: sizes.length > 0 ? sizes : undefined
    };
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      // Use a case-insensitive comparison by converting both to lowercase
      // This approach avoids SQL injection via direct string interpolation
      const lowerCategory = category.toLowerCase();
      const result = await db.select()
        .from(products)
        .where(
          // Compare lowercase versions for case insensitivity
          (products) => {
            // SQLite and PostgreSQL use LOWER function
            return sql`LOWER(${products.category}) = ${lowerCategory}`;
          }
        );
        
      console.log(`Found ${result.length} products for category '${category}'`);
      return result;
    } catch (error) {
      console.error(`Error fetching products for category '${category}':`, error);
      return [];
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    // First, delete all related wishlist items
    await db.delete(wishlistItems).where(eq(wishlistItems.productId, id));
    
    // Then, delete all related cart items
    await db.delete(cartItems).where(eq(cartItems.productId, id));
    
    // Finally, delete the product
    const result = await db.delete(products).where(eq(products.id, id));
    return !!result;
  }

  async getTopSellingProducts(limit: number): Promise<(Product & { totalSold: number })[]> {
    // Get products with their actual sales data from order_items
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      originalPrice: products.originalPrice,
      stock: products.stock,
      category: products.category,
      images: products.images,
      highlights: products.highlights,
      specifications: products.specifications,
      rating: products.rating,
      reviewCount: products.reviewCount,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      hsnCode: products.hsnCode,
      hasVariants: products.hasVariants,
      model3d: products.model3d,
      totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`
    })
    .from(products)
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .leftJoin(orders, and(
      eq(orderItems.orderId, orders.id),
      sql`${orders.status} IN ('confirmed', 'shipped', 'delivered')`
    ))
    .groupBy(products.id)
    .orderBy(sql`COALESCE(SUM(${orderItems.quantity}), 0) DESC`)
    .limit(limit);
    
    return result;
  }

  async getDeals(limit: number): Promise<Product[]> {
    // Return products with non-null originalPrice and where original > current
    return await db.select().from(products)
      .where(
        and(
          gte(products.originalPrice, products.price)
        )
      )
      .orderBy(desc(products.originalPrice))
      .limit(limit);
  }

  async searchProductSuggestions(query: string): Promise<Array<{ id: number; name: string; price: number; images: string[]; category: string }>> {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const results = await db.select({
      id: products.id,
      name: products.name,
      price: products.price,
      images: products.images,
      category: products.category
    })
    .from(products)
    .where(
      or(
        sql`LOWER(${products.name}) LIKE ${searchTerm}`,
        sql`LOWER(${products.description}) LIKE ${searchTerm}`,
        sql`LOWER(${products.category}) LIKE ${searchTerm}`
      )
    )
    .limit(8);

    return results;
  }

  // Product Variant methods
  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db.select().from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(productVariants.colorName, productVariants.sizeName);
  }

  async getProductVariantById(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants)
      .where(eq(productVariants.id, id));
    return variant;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async updateProductVariant(id: number, variantData: Partial<ProductVariant>): Promise<ProductVariant | undefined> {
    const [updatedVariant] = await db.update(productVariants)
      .set(variantData)
      .where(eq(productVariants.id, id))
      .returning();
    return updatedVariant;
  }

  async deleteProductVariant(id: number): Promise<boolean> {
    const result = await db.delete(productVariants).where(eq(productVariants.id, id));
    return !!result;
  }

  async deleteProductVariants(productId: number): Promise<boolean> {
    const result = await db.delete(productVariants).where(eq(productVariants.productId, productId));
    return !!result;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderInvoice(id: number, invoiceUrl: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ 
        invoiceUrl, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderTracking(id: number, trackingId: string, trackingUrl?: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ 
        trackingId,
        trackingUrl,
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Items methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const [newCartItem] = await db.insert(cartItems).values(cartItem).returning();
    return newCartItem;
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db.update(cartItems)
      .set({ 
        quantity, 
        updatedAt: new Date() 
      })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem;
  }

  async updateCartItem(id: number, updates: { quantity?: number; selectedColor?: string; selectedSize?: string }): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db.update(cartItems)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return !!result;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return !!result;
  }

  // User Address methods
  async getUserAddresses(userId: number): Promise<UserAddress[]> {
    const result = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId));
    
    return result;
  }

  async getUserAddressById(id: number): Promise<UserAddress | undefined> {
    const [result] = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.id, id));
    
    return result;
  }

  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    // If this is the first address for the user or isDefault is true, set it as default
    const existingAddresses = await this.getUserAddresses(address.userId);
    const isDefault = address.isDefault || existingAddresses.length === 0;
    
    // If we're setting this as default, update all other addresses to not be default
    if (isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(userAddresses.userId, address.userId),
          eq(userAddresses.isDefault, true)
        ));
    }
    
    // Create the new address
    const [result] = await db
      .insert(userAddresses)
      .values({
        ...address,
        isDefault
      })
      .returning();
    
    return result;
  }

  async updateUserAddress(id: number, addressData: Partial<UserAddress>): Promise<UserAddress | undefined> {
    // Get the address first
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.id, id));
    
    if (!address) return undefined;
    
    // If setting as default, update all other addresses for this user
    if (addressData.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(userAddresses.userId, address.userId),
          ne(userAddresses.id, id),
          eq(userAddresses.isDefault, true)
        ));
    }
    
    // Update the address
    const [result] = await db
      .update(userAddresses)
      .set(addressData)
      .where(eq(userAddresses.id, id))
      .returning();
    
    return result;
  }

  async deleteUserAddress(id: number): Promise<boolean> {
    // Get the address first
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.id, id));
    
    if (!address) return false;
    
    // Delete the address
    await db
      .delete(userAddresses)
      .where(eq(userAddresses.id, id));
    
    // If it was a default address, set another one as default (if any exist)
    if (address.isDefault) {
      const [otherAddress] = await db
        .select()
        .from(userAddresses)
        .where(eq(userAddresses.userId, address.userId))
        .limit(1);
      
      if (otherAddress) {
        await db
          .update(userAddresses)
          .set({ isDefault: true })
          .where(eq(userAddresses.id, otherAddress.id));
      }
    }
    
    return true;
  }

  async setDefaultUserAddress(userId: number, addressId: number): Promise<boolean> {
    // Verify address belongs to user
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, userId)
      ));
    
    if (!address) return false;
    
    // Clear default status from other addresses
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(and(
        eq(userAddresses.userId, userId),
        ne(userAddresses.id, addressId)
      ));
    
    // Set this address as default
    await db
      .update(userAddresses)
      .set({ isDefault: true })
      .where(eq(userAddresses.id, addressId));
    
    return true;
  }

  // Referral system methods
  async getUserReferral(userId: number): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.userId, userId));
    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, code));
    return referral;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values(referral)
      .returning();
    return newReferral;
  }

  async getUserReceivedRewards(userId: number): Promise<ReferralReward[]> {
    return db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId));
  }

  async checkHasReceivedReward(userId: number): Promise<boolean> {
    const count = await db
      .select({ count: sql`count(*)` })
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId))
      .then(result => Number(result[0].count));
    return count > 0;
  }

  async createReferralReward(reward: InsertReferralReward): Promise<ReferralReward> {
    const [newReward] = await db
      .insert(referralRewards)
      .values(reward)
      .returning();
    return newReward;
  }

  async updateReferralRewardStatus(id: number, status: string): Promise<ReferralReward | undefined> {
    const [updated] = await db
      .update(referralRewards)
      .set({ 
        status, 
        processedAt: status === 'processed' ? new Date() : undefined 
      })
      .where(eq(referralRewards.id, id))
      .returning();
    return updated;
  }

  // Wishlist methods
  async getUserWishlist(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select({
        id: wishlistItems.id,
        userId: wishlistItems.userId,
        productId: wishlistItems.productId,
        createdAt: wishlistItems.createdAt,
        updatedAt: wishlistItems.updatedAt,
        product: products
      })
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));
    
    return result.map(item => ({
      ...item,
      product: item.product!
    }));
  }

  async getWishlistItem(userId: number, productId: number): Promise<WishlistItem | undefined> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return item;
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const [newItem] = await db
      .insert(wishlistItems)
      .values(wishlistItem)
      .returning();
    return newItem;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return !!result;
  }

  // Navbar Settings methods
  async getNavbarSettings(): Promise<NavbarSettings | undefined> {
    const [settings] = await db
      .select()
      .from(navbarSettings)
      .where(eq(navbarSettings.isActive, true))
      .orderBy(desc(navbarSettings.createdAt))
      .limit(1);
    return settings;
  }

  async updateNavbarSettings(settings: InsertNavbarSettings): Promise<NavbarSettings> {
    // Deactivate existing settings
    await db
      .update(navbarSettings)
      .set({ isActive: false });

    // Insert new settings
    const [newSettings] = await db
      .insert(navbarSettings)
      .values({
        ...settings,
        isActive: true,
        updatedAt: new Date()
      })
      .returning();
    
    return newSettings;
  }
}

export const storage = new DatabaseStorage();
