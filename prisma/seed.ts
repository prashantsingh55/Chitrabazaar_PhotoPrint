import { PrismaClient, Role, StudioStatus, OrderStatus, DeliveryMethod, PaymentStatus, PayoutStatus, PrintSize, PaperType, PrintFinish, RecipientType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Chitrabazaar database seed...');

  // Clear existing records in reverse dependency order
  await prisma.notification.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.payout.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.photoStudio.deleteMany({});
  await prisma.platformSetting.deleteMany({});

  console.log('🧹 Existing database records wiped.');

  // Common hashed passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const studioPasswordHash = await bcrypt.hash('studio123', 10);
  const customerPasswordHash = await bcrypt.hash('customer123', 10);

  // 1. Create Super Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Chitrabazaar HQ Admin',
      email: 'admin@chitrabazaar.com',
      phone: '+1 (555) 019-2834',
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
    },
  });
  console.log('✅ Created Super Admin:', adminUser.email);

  // 2. Create Photo Studios & their Studio Admins
  const apexStudio = await prisma.photoStudio.create({
    data: {
      name: 'Apex Color Lab & Studio',
      ownerName: 'Vikram Malhotra',
      email: 'apex@photostudio.com',
      phone: '+91 98201 12345',
      address: 'Shop 42, Connaught Circus, Inner Circle',
      city: 'New Delhi',
      pincode: '110001',
      status: StudioStatus.ACTIVE,
      commissionRate: 15.0,
      rating: 4.9,
      reviewCount: 142,
      workingHours: '9:00 AM - 9:00 PM (Mon-Sat)',
      servicesOffered: '4x6, 5x7, A4, 8x10, Passport, Glossy, Matte, Lustre',
    },
  });

  const apexAdmin = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra (Apex)',
      email: 'apex@photostudio.com',
      phone: '+91 98201 12345',
      passwordHash: studioPasswordHash,
      role: Role.STUDIO_ADMIN,
      studioId: apexStudio.id,
    },
  });

  const prismStudio = await prisma.photoStudio.create({
    data: {
      name: 'Prism Photo Express',
      ownerName: 'Ananya Sharma',
      email: 'prism@photostudio.com',
      phone: '+91 98450 98765',
      address: 'Plot 18, 100ft Road, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      status: StudioStatus.ACTIVE,
      commissionRate: 15.0,
      rating: 4.8,
      reviewCount: 89,
      workingHours: '10:00 AM - 8:30 PM (Daily)',
      servicesOffered: '4x6, 5x7, A4, 12x18, Canvas, Glossy, Matte',
    },
  });

  const prismAdmin = await prisma.user.create({
    data: {
      name: 'Ananya Sharma (Prism)',
      email: 'prism@photostudio.com',
      phone: '+91 98450 98765',
      passwordHash: studioPasswordHash,
      role: Role.STUDIO_ADMIN,
      studioId: prismStudio.id,
    },
  });

  const metroStudio = await prisma.photoStudio.create({
    data: {
      name: 'Metro Digital Prints',
      ownerName: 'Rohan Verma',
      email: 'metro@photostudio.com',
      phone: '+91 98300 55443',
      address: '88 Park Street, Near Metro Station',
      city: 'Kolkata',
      pincode: '700016',
      status: StudioStatus.PENDING,
      commissionRate: 15.0,
      rating: 5.0,
      reviewCount: 0,
      workingHours: '9:30 AM - 7:30 PM',
      servicesOffered: '4x6, 5x7, Passport, Glossy, Matte',
    },
  });

  const metroAdmin = await prisma.user.create({
    data: {
      name: 'Rohan Verma (Metro)',
      email: 'metro@photostudio.com',
      phone: '+91 98300 55443',
      passwordHash: studioPasswordHash,
      role: Role.STUDIO_ADMIN,
      studioId: metroStudio.id,
    },
  });
  console.log('✅ Created 3 Studios & Studio Admins (Apex, Prism, Metro)');

  // 3. Create Customers & Saved Addresses
  const rahulCustomer = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  const rahulAddress1 = await prisma.address.create({
    data: {
      userId: rahulCustomer.id,
      label: 'Home',
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
      line1: 'Flat 402, Sunshine Apartments, Barakhamba Road',
      city: 'New Delhi',
      pincode: '110001',
      isDefault: true,
    },
  });

  const rahulAddress2 = await prisma.address.create({
    data: {
      userId: rahulCustomer.id,
      label: 'Office',
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
      line1: 'Building 10B, DLF Cyber City, Sector 24',
      city: 'Gurugram',
      pincode: '122002',
      isDefault: false,
    },
  });

  const snehaCustomer = await prisma.user.create({
    data: {
      name: 'Sneha Patel',
      email: 'sneha@example.com',
      phone: '+91 98111 22334',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  const snehaAddress = await prisma.address.create({
    data: {
      userId: snehaCustomer.id,
      label: 'Home',
      fullName: 'Sneha Patel',
      phone: '+91 98111 22334',
      line1: 'B-12, Palm Meadows, Whitefield',
      city: 'Bengaluru',
      pincode: '560066',
      isDefault: true,
    },
  });
  console.log('✅ Created Customers: rahul@example.com, sneha@example.com');

  // Sample high quality stock photo URLs for mock items
  const samplePhotos = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80',
  ];

  // 4. Create Orders across all pipeline statuses
  // Order 1: PLACED (waiting for Apex acceptance)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10491',
      customerId: rahulCustomer.id,
      studioId: apexStudio.id,
      status: OrderStatus.PLACED,
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryAddressId: rahulAddress1.id,
      subtotal: 18.0,
      deliveryFee: 3.5,
      platformFee: 1.5,
      totalAmount: 23.0,
      paymentStatus: PaymentStatus.PAID,
      notes: 'Please ensure high vibrancy for the portrait shots.',
      createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
      items: {
        create: [
          {
            photoUrl: samplePhotos[0],
            originalFilename: 'family_vacation_01.jpg',
            size: PrintSize.SIZE_4X6,
            paperType: PaperType.GLOSSY,
            finish: PrintFinish.BORDERLESS,
            quantity: 10,
            unitPrice: 1.2,
            totalPrice: 12.0,
          },
          {
            photoUrl: samplePhotos[1],
            originalFilename: 'sunset_portrait.png',
            size: PrintSize.SIZE_8X10,
            paperType: PaperType.MATTE,
            finish: PrintFinish.WHITE_BORDER,
            quantity: 1,
            unitPrice: 6.0,
            totalPrice: 6.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 23.0,
          currency: '$',
          method: 'MOCK_PAYMENT',
          status: PaymentStatus.PAID,
          transactionId: 'TXN-9841203',
        },
      },
    },
  });

  // Order 2: PRINTING (In production at Apex)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10492',
      customerId: snehaCustomer.id,
      studioId: apexStudio.id,
      status: OrderStatus.PRINTING,
      deliveryMethod: DeliveryMethod.PICKUP,
      subtotal: 24.0,
      deliveryFee: 0.0,
      platformFee: 1.5,
      totalAmount: 25.5,
      paymentStatus: PaymentStatus.PAID,
      notes: 'Customer will pick up before 5 PM.',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
      items: {
        create: [
          {
            photoUrl: samplePhotos[2],
            originalFilename: 'anniversary_album_04.jpg',
            size: PrintSize.SIZE_5X7,
            paperType: PaperType.LUSTRE,
            finish: PrintFinish.BORDERLESS,
            quantity: 6,
            unitPrice: 4.0,
            totalPrice: 24.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 25.5,
          currency: '$',
          method: 'MOCK_PAYMENT',
          status: PaymentStatus.PAID,
          transactionId: 'TXN-9841204',
        },
      },
    },
  });

  // Order 3: READY (Ready for pickup at Apex)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10493',
      customerId: rahulCustomer.id,
      studioId: apexStudio.id,
      status: OrderStatus.READY,
      deliveryMethod: DeliveryMethod.PICKUP,
      subtotal: 15.0,
      deliveryFee: 0.0,
      platformFee: 1.5,
      totalAmount: 16.5,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date(Date.now() - 5 * 3600 * 1000), // 5 hours ago
      items: {
        create: [
          {
            photoUrl: samplePhotos[3],
            originalFilename: 'passport_official.jpg',
            size: PrintSize.SIZE_PASSPORT,
            paperType: PaperType.MATTE,
            finish: PrintFinish.BORDERLESS,
            quantity: 8,
            unitPrice: 1.875,
            totalPrice: 15.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 16.5,
          currency: '$',
          method: 'MOCK_PAYMENT',
          status: PaymentStatus.PAID,
          transactionId: 'TXN-9841205',
        },
      },
    },
  });

  // Order 4: COMPLETED (Apex)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10494',
      customerId: snehaCustomer.id,
      studioId: apexStudio.id,
      status: OrderStatus.COMPLETED,
      deliveryMethod: DeliveryMethod.DELIVERY,
      deliveryAddressId: snehaAddress.id,
      subtotal: 45.0,
      deliveryFee: 4.0,
      platformFee: 2.0,
      totalAmount: 51.0,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
      items: {
        create: [
          {
            photoUrl: samplePhotos[0],
            originalFilename: 'wedding_portrait_main.jpg',
            size: PrintSize.SIZE_A4,
            paperType: PaperType.GLOSSY,
            finish: PrintFinish.WHITE_BORDER,
            quantity: 3,
            unitPrice: 15.0,
            totalPrice: 45.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 51.0,
          currency: '$',
          method: 'MOCK_PAYMENT',
          status: PaymentStatus.PAID,
          transactionId: 'TXN-9841206',
        },
      },
    },
  });

  // Order 5: COMPLETED (Prism)
  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10495',
      customerId: rahulCustomer.id,
      studioId: prismStudio.id,
      status: OrderStatus.COMPLETED,
      deliveryMethod: DeliveryMethod.PICKUP,
      subtotal: 36.0,
      deliveryFee: 0.0,
      platformFee: 2.0,
      totalAmount: 38.0,
      paymentStatus: PaymentStatus.PAID,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000), // 5 days ago
      items: {
        create: [
          {
            photoUrl: samplePhotos[1],
            originalFilename: 'landscape_mountain.jpg',
            size: PrintSize.SIZE_12X18,
            paperType: PaperType.MATTE,
            finish: PrintFinish.BORDERLESS,
            quantity: 2,
            unitPrice: 18.0,
            totalPrice: 36.0,
          },
        ],
      },
      payments: {
        create: {
          amount: 38.0,
          currency: '$',
          method: 'MOCK_PAYMENT',
          status: PaymentStatus.PAID,
          transactionId: 'TXN-9841207',
        },
      },
    },
  });

  // Order 6: CANCELLED
  const order6 = await prisma.order.create({
    data: {
      orderNumber: 'CB-10496',
      customerId: snehaCustomer.id,
      studioId: prismStudio.id,
      status: OrderStatus.CANCELLED,
      deliveryMethod: DeliveryMethod.PICKUP,
      subtotal: 12.0,
      deliveryFee: 0.0,
      platformFee: 1.0,
      totalAmount: 13.0,
      paymentStatus: PaymentStatus.REFUNDED,
      cancellationReason: 'Customer requested cancellation due to wrong file uploaded.',
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      items: {
        create: [
          {
            photoUrl: samplePhotos[2],
            originalFilename: 'draft_test.jpg',
            size: PrintSize.SIZE_4X6,
            paperType: PaperType.GLOSSY,
            finish: PrintFinish.BORDERLESS,
            quantity: 10,
            unitPrice: 1.2,
            totalPrice: 12.0,
          },
        ],
      },
    },
  });
  console.log('✅ Created 6 Orders (CB-10491 to CB-10496)');

  // 5. Dedicated Payout Ledger Records (Audit Trail)
  // Settled payout for Apex for Order 4
  const payout1 = await prisma.payout.create({
    data: {
      studioId: apexStudio.id,
      periodStart: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      periodEnd: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      orderIds: [order4.id],
      grossAmount: 45.0,
      commissionAmount: 6.75, // 15% of 45.0
      netPayout: 38.25,
      status: PayoutStatus.PAID,
      paidAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      transactionRef: 'NEFT-CHITRA-892102',
      notes: 'Weekly settlement for week 35 completed.',
    },
  });

  // Pending payout for Apex (Order 3 when ready/completed)
  const payout2 = await prisma.payout.create({
    data: {
      studioId: apexStudio.id,
      periodStart: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      periodEnd: new Date(),
      orderIds: [order2.id, order3.id],
      grossAmount: 39.0, // 24 + 15
      commissionAmount: 5.85, // 15%
      netPayout: 33.15,
      status: PayoutStatus.PENDING,
      notes: 'Current cycle pending payout settlement.',
    },
  });
  console.log('✅ Created Dedicated Payout Records (Settled & Pending)');

  // 6. In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientType: RecipientType.STUDIO,
        recipientId: apexStudio.id,
        title: '🚨 New Order Received: CB-10491',
        message: 'Rahul Sharma placed a new order for 11 prints. Action required: Accept & Print.',
        link: `/studio/orders/${order1.id}`,
        isRead: false,
      },
      {
        recipientType: RecipientType.CUSTOMER,
        recipientId: rahulCustomer.id,
        title: '✨ Order CB-10493 is Ready for Pickup!',
        message: 'Your photo prints are freshly packaged and ready at Apex Color Lab.',
        link: `/orders/${order3.id}`,
        isRead: false,
      },
      {
        recipientType: RecipientType.SUPER_ADMIN,
        recipientId: 'ALL_ADMINS',
        title: '🏢 New Studio Partner Application',
        message: 'Metro Digital Prints (Kolkata) submitted an application for review.',
        link: `/admin/studios/${metroStudio.id}`,
        isRead: false,
      },
    ],
  });
  console.log('✅ Created In-App Notifications');

  // 7. Platform Settings
  await prisma.platformSetting.createMany({
    data: [
      { key: 'default_currency', value: '$', description: 'Default system currency symbol' },
      { key: 'platform_commission', value: '15', description: 'Platform commission percentage cut' },
      { key: 'default_delivery_fee', value: '4.99', description: 'Flat home delivery fee' },
      { key: 'min_order_amount', value: '5.00', description: 'Minimum order cart value' },
      { key: 'announcement_banner', value: '📸 Festive season printing offer: 10% extra discount on 12x18 portraits!', description: 'Global marketing banner' },
    ],
  });
  console.log('✅ Created Platform Settings');

  console.log('🚀 Seed process finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
