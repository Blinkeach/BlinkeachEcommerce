import { db } from '../server/db';
import { products, users } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function seedDatabase() {
  console.log('Seeding database...');
  
  // Seed admin user if not exists
  const adminEmail = 'admin@blinkeach.com';
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, adminEmail));
  
  if (!existingAdmin) {
    console.log('Creating admin user...');
    await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin123'),
      email: adminEmail,
      fullName: 'Admin User',
      isAdmin: true,
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    });
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
  
  // Check if products exist
  const existingProducts = await db.select().from(products);
  if (existingProducts.length > 0) {
    console.log(`${existingProducts.length} products already exist, skipping product seeding`);
    return;
  }
  
  // Seed products
  console.log('Creating sample products...');
  
  const sampleProducts = [
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
    },
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
        "Bluetooth 5.0"
      ],
      specifications: {
        "Driver Size": "40mm",
        "Connectivity": "Bluetooth 5.0",
        "Battery": "300mAh, up to 15 hours playtime",
        "Charging Time": "2.5 hours",
        "Frequency Response": "20Hz-20kHz",
        "Impedance": "32Ω"
      },
      rating: 4.2,
      reviewCount: 5678
    },
    {
      name: "ASUS VivoBook 15 (2022)",
      description: "The ASUS VivoBook 15 is perfect for work and entertainment with its 15.6-inch Full HD display and powerful Intel Core i5 processor. The ErgoLift hinge design provides a comfortable typing position, while the comprehensive connectivity options ensure you can connect all your devices.",
      price: 5499900, // ₹54,999
      originalPrice: 6499900, // ₹64,999
      stock: 50,
      category: "Laptops",
      images: [
        "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
      ],
      highlights: [
        "15.6-inch Full HD display",
        "Intel Core i5-1235U processor",
        "8GB DDR4 RAM",
        "512GB SSD",
        "Windows 11 Home"
      ],
      specifications: {
        "Display": "15.6-inch Full HD (1920 x 1080)",
        "Processor": "Intel Core i5-1235U",
        "Graphics": "Intel Iris Xe Graphics",
        "Memory": "8GB DDR4",
        "Storage": "512GB PCIe NVMe M.2 SSD",
        "Operating System": "Windows 11 Home",
        "Battery": "42WHrs, 3-cell lithium-polymer",
        "Weight": "1.8kg"
      },
      rating: 4.3,
      reviewCount: 1876
    },
    {
      name: "Lenovo IdeaPad Slim 3",
      description: "Stay productive with the Lenovo IdeaPad Slim 3, featuring an AMD Ryzen 5 processor and Radeon graphics. The anti-glare display reduces eye strain during long working hours, and the rapid charge technology provides quick power when you need it most.",
      price: 4999900, // ₹49,999
      originalPrice: 5999900, // ₹59,999
      stock: 60,
      category: "Laptops",
      images: [
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
      ],
      highlights: [
        "AMD Ryzen 5 5500U",
        "15.6-inch FHD display",
        "8GB RAM",
        "512GB SSD",
        "Radeon Graphics"
      ],
      specifications: {
        "Display": "15.6-inch FHD (1920 x 1080) anti-glare",
        "Processor": "AMD Ryzen 5 5500U",
        "Graphics": "AMD Radeon Graphics",
        "Memory": "8GB DDR4-3200",
        "Storage": "512GB SSD M.2 PCIe",
        "Operating System": "Windows 11 Home",
        "Battery": "Up to 7 hours",
        "Weight": "1.65kg"
      },
      rating: 4.4,
      reviewCount: 2109
    }
  ];
  
  // Insert products in batches
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
  }
  
  console.log(`Created ${sampleProducts.length} sample products`);
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Database seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });