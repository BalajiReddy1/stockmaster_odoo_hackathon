require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting comprehensive seed process...');

    // Create users
    const adminEmail = 'admin@stockmaster.com';
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Admin user created');
    }

    // Create test user for delivery operations
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'WAREHOUSE_STAFF',
        isActive: true,
      },
    });
    console.log('✅ Test user created:', testUser.email);

    // Create suppliers
    const suppliers = await prisma.supplier.createMany({
      data: [
        {
          name: 'TechCorp Supplies',
          code: 'TECH001',
          email: 'orders@techcorp.com',
          phone: '+1-555-0101',
          address: '123 Tech Street, Silicon Valley, CA 94000'
        },
        {
          name: 'Global Electronics',
          code: 'ELEC002',
          email: 'supply@globalelectronics.com',
          phone: '+1-555-0102',
          address: '456 Circuit Avenue, Austin, TX 73301'
        },
        {
          name: 'Office Essentials Inc',
          code: 'OFFC003',
          email: 'procurement@officeessentials.com',
          phone: '+1-555-0103',
          address: '789 Business Blvd, Chicago, IL 60601'
        }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${suppliers.count} suppliers`);

    // Create categories (combine both sets)
    const categories = await prisma.productCategory.createMany({
      data: [
        { name: 'Electronics', description: 'Electronic devices and accessories' },
        { name: 'Office Supplies', description: 'Office stationery and supplies' },
        { name: 'Furniture', description: 'Office and home furniture' },
        { name: 'IT Equipment', description: 'Computer and IT hardware' },
        { name: 'Consumables', description: 'Consumable items' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${categories.count} categories`);

    // Get created categories
    const electronicsCategory = await prisma.productCategory.findFirst({ where: { name: 'Electronics' } });
    const officeCategory = await prisma.productCategory.findFirst({ where: { name: 'Office Supplies' } });
    const furnitureCategory = await prisma.productCategory.findFirst({ where: { name: 'Furniture' } });
    const itCategory = await prisma.productCategory.findFirst({ where: { name: 'IT Equipment' } });

    // Create comprehensive product list (merge both)
    const products = [
      // Electronics
      { name: 'Wireless Mouse', sku: 'WM-001', description: 'Ergonomic wireless mouse with USB receiver', categoryId: electronicsCategory.id, unitOfMeasure: 'piece', initialStock: 150, reorderLevel: 50, reorderQuantity: 500 },
      { name: 'USB-C Cable 6ft', sku: 'UC-002', description: 'High-speed USB-C to USB-A cable, 6 feet length', categoryId: electronicsCategory.id, unitOfMeasure: 'piece', initialStock: 300, reorderLevel: 100, reorderQuantity: 1000 },
      { name: 'Bluetooth Headphones', sku: 'BH-003', description: 'Noise-cancelling Bluetooth headphones', categoryId: electronicsCategory.id, unitOfMeasure: 'piece', initialStock: 80, reorderLevel: 20, reorderQuantity: 200 },
      
      // Office Supplies
      { name: 'A4 Copy Paper', sku: 'CP-004', description: '500 sheets white A4 copy paper, 80gsm', categoryId: officeCategory.id, unitOfMeasure: 'ream', initialStock: 500, reorderLevel: 100, reorderQuantity: 1000 },
      { name: 'Blue Ballpoint Pen', sku: 'BP-005', description: 'Medium tip blue ballpoint pen', categoryId: officeCategory.id, unitOfMeasure: 'piece', initialStock: 1000, reorderLevel: 200, reorderQuantity: 2000 },
      { name: 'Stapler', sku: 'ST-006', description: 'Heavy-duty desktop stapler', categoryId: officeCategory.id, unitOfMeasure: 'piece', initialStock: 50, reorderLevel: 10, reorderQuantity: 100 },
      
      // IT Equipment
      { name: 'Laptop Stand', sku: 'LS-007', description: 'Adjustable aluminum laptop stand', categoryId: itCategory.id, unitOfMeasure: 'piece', initialStock: 60, reorderLevel: 15, reorderQuantity: 150 },
      { name: 'External Hard Drive 1TB', sku: 'HD-008', description: 'Portable USB 3.0 external hard drive, 1TB capacity', categoryId: itCategory.id, unitOfMeasure: 'piece', initialStock: 120, reorderLevel: 25, reorderQuantity: 250 },
      
      // Furniture (for delivery operations)
      { name: 'Desk', sku: 'DESK001', description: 'Office desk with drawers', categoryId: furnitureCategory.id, unitOfMeasure: 'unit', initialStock: 50, reorderLevel: 10, reorderQuantity: 20, isActive: true },
      { name: 'Office Chair', sku: 'CHAIR001', description: 'Ergonomic office chair with lumbar support', categoryId: furnitureCategory.id, unitOfMeasure: 'unit', initialStock: 100, reorderLevel: 20, reorderQuantity: 50, isActive: true },
      { name: 'Conference Table', sku: 'TABLE001', description: 'Large conference table', categoryId: furnitureCategory.id, unitOfMeasure: 'unit', initialStock: 15, reorderLevel: 5, reorderQuantity: 10, isActive: true },
      { name: 'Desk Lamp', sku: 'DL-010', description: 'LED desk lamp with adjustable brightness', categoryId: furnitureCategory.id, unitOfMeasure: 'piece', initialStock: 80, reorderLevel: 20, reorderQuantity: 200 },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });
    }
    console.log(`✅ Created ${products.length} products`);

    // Create warehouses (merge both approaches)
    const warehouses = [
      { name: 'Main Warehouse', code: 'MW01', address: '1000 Storage Way, Distribution City, TX 75001', isActive: true },
      { name: 'North Distribution Center', code: 'NDC02', address: '500 Northern Blvd, Northville, NY 10001', isActive: true },
      { name: 'West Coast Facility', code: 'WCF03', address: '2000 Pacific Drive, Los Angeles, CA 90001', isActive: true },
    ];

    for (const warehouse of warehouses) {
      await prisma.warehouse.upsert({
        where: { code: warehouse.code },
        update: {},
        create: warehouse
      });
    }
    console.log(`✅ Created ${warehouses.length} warehouses`);

    // Get created warehouses
    const mainWarehouse = await prisma.warehouse.findUnique({ where: { code: 'MW01' } });
    const northWarehouse = await prisma.warehouse.findUnique({ where: { code: 'NDC02' } });
    const westWarehouse = await prisma.warehouse.findUnique({ where: { code: 'WCF03' } });

    // Create locations
    const locations = [
      // Main Warehouse locations
      { name: 'Stock Location 1', code: 'MW-A-01-01', warehouseId: mainWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'A-01-02', code: 'MW-A-01-02', warehouseId: mainWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'A-02-01', code: 'MW-A-02-01', warehouseId: mainWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'B-01-01', code: 'MW-B-01-01', warehouseId: mainWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Receiving Bay 1', code: 'MW-REC-01', warehouseId: mainWarehouse.id, type: 'RECEIVING', isActive: true },
      { name: 'Shipping Dock 1', code: 'MW-SHIP-01', warehouseId: mainWarehouse.id, type: 'SHIPPING', isActive: true },
      
      // North Distribution Center
      { name: 'Zone A-1', code: 'NDC-A-01', warehouseId: northWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Zone A-2', code: 'NDC-A-02', warehouseId: northWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Zone B-1', code: 'NDC-B-01', warehouseId: northWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Receiving', code: 'NDC-REC-01', warehouseId: northWarehouse.id, type: 'RECEIVING', isActive: true },
      
      // West Coast Facility
      { name: 'Section 1A', code: 'WCF-1A', warehouseId: westWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Section 1B', code: 'WCF-1B', warehouseId: westWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Section 2A', code: 'WCF-2A', warehouseId: westWarehouse.id, type: 'STORAGE', isActive: true },
      { name: 'Quarantine', code: 'WCF-QUAR-01', warehouseId: westWarehouse.id, type: 'QUARANTINE', isActive: true }
    ];

    for (const location of locations) {
      await prisma.location.upsert({
        where: { code: location.code },
        update: {},
        create: location
      });
    }
    console.log(`✅ Created ${locations.length} locations`);

    // Create customer for delivery
    const customer = await prisma.customer.upsert({
      where: { code: 'CUST001' },
      update: {},
      create: {
        name: 'Azure Interior',
        code: 'CUST001',
        email: 'contact@azureinterior.com',
        phone: '+1234567890',
        address: '456 Customer Ave, City',
        isActive: true,
      },
    });
    console.log('✅ Customer created:', customer.name);

    // Get products for stock and delivery
    const createdProducts = await prisma.product.findMany();
    const createdLocations = await prisma.location.findMany();
    const stockLocation1 = await prisma.location.findUnique({ where: { code: 'MW-A-01-01' } });
    const desk = await prisma.product.findUnique({ where: { sku: 'DESK001' } });
    const chair = await prisma.product.findUnique({ where: { sku: 'CHAIR001' } });
    const table = await prisma.product.findUnique({ where: { sku: 'TABLE001' } });

    // Create stock locations for all products
    const stockData = [];
    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      const locationsToStock = createdLocations.slice(i * 2, (i * 2) + 3);
      
      for (const location of locationsToStock) {
        const quantity = Math.floor(Math.random() * 200) + 50;
        stockData.push({ productId: product.id, locationId: location.id, quantity });
      }
    }

    // Add specific stock for delivery products
    if (desk && chair && table && stockLocation1) {
      stockData.push(
        { productId: desk.id, locationId: stockLocation1.id, quantity: 50 },
        { productId: chair.id, locationId: stockLocation1.id, quantity: 100 },
        { productId: table.id, locationId: stockLocation1.id, quantity: 15 }
      );
    }

    for (const stock of stockData) {
      await prisma.stockLocation.upsert({
        where: {
          productId_locationId: {
            productId: stock.productId,
            locationId: stock.locationId
          }
        },
        update: { quantity: stock.quantity },
        create: {
          productId: stock.productId,
          locationId: stock.locationId,
          quantity: stock.quantity,
          reserved: 0,
          available: stock.quantity
        }
      });
    }
    console.log(`✅ Created ${stockData.length} stock locations`);

    // Create sample stock ledger entries
    for (let i = 0; i < 20; i++) {
      const randomStock = stockData[Math.floor(Math.random() * stockData.length)];
      const movementTypes = ['IN', 'OUT'];
      const documentTypes = ['RECEIPT', 'ADJUSTMENT', 'TRANSFER'];
      const randomMovementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const randomDocumentType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      const balanceBefore = randomStock.quantity;
      const balanceAfter = randomMovementType === 'OUT' ? balanceBefore - quantity : balanceBefore + quantity;

      await prisma.stockLedger.create({
        data: {
          productId: randomStock.productId,
          locationId: randomStock.locationId,
          documentType: randomDocumentType,
          documentId: `DOC-${Date.now()}-${i}`,
          movementType: randomMovementType,
          quantity: randomMovementType === 'OUT' ? -quantity : quantity,
          balanceBefore,
          balanceAfter,
          reference: `Initial stock ledger - ${randomDocumentType}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
    console.log('✅ Created 20 sample stock ledger entries');

    // Create delivery orders
    if (desk && chair && table && stockLocation1) {
      await prisma.deliveryOrder.create({
        data: {
          deliveryNumber: 'WH/OUT/0001',
          customerId: customer.id,
          locationId: stockLocation1.id,
          status: 'READY',
          scheduledDate: new Date('2025-11-25'),
          notes: 'Urgent delivery for Azure Interior',
          userId: testUser.id,
          lines: {
            create: [{ productId: desk.id, quantity: 6, picked: 6, packed: 6, delivered: 0, notes: 'Handle with care' }]
          },
        },
      });

      await prisma.deliveryOrder.create({
        data: {
          deliveryNumber: 'WH/OUT/0002',
          customerId: customer.id,
          locationId: stockLocation1.id,
          status: 'WAITING',
          scheduledDate: new Date('2025-11-26'),
          notes: 'Regular delivery',
          userId: testUser.id,
          lines: {
            create: [
              { productId: chair.id, quantity: 20, picked: 0, packed: 0, delivered: 0 },
              { productId: table.id, quantity: 3, picked: 0, packed: 0, delivered: 0 }
            ]
          },
        },
      });

      await prisma.deliveryOrder.create({
        data: {
          deliveryNumber: 'WH/OUT/0003',
          customerId: customer.id,
          locationId: stockLocation1.id,
          status: 'DRAFT',
          scheduledDate: new Date('2025-11-28'),
          notes: 'Pending approval',
          userId: testUser.id,
          lines: {
            create: [{ productId: desk.id, quantity: 10, picked: 0, packed: 0, delivered: 0 }]
          },
        },
      });
      console.log('✅ Created 3 delivery orders');
    }

    console.log('🎉 Comprehensive seed completed successfully!');
    console.log(`
📊 Summary:
- Admin User: ${adminEmail} (password: admin123)
- Test User: test@example.com (password: password123)
- ${warehouses.length} Warehouses
- ${locations.length} Locations
- ${products.length} Products
- ${stockData.length} Stock Locations
- 20 Stock Ledger Records
- 3 Suppliers
- 5 Categories
- 1 Customer
- 3 Delivery Orders

🚀 You can now start the application and test both inventory AND delivery features!
    `);

  } catch (error) {
    console.error('❌ Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  });
