const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting seed process...');

    // Create admin user if not exists
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
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user created');
    }

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

    // Create categories
    const categories = await prisma.productCategory.createMany({
      data: [
        { name: 'Electronics' },
        { name: 'Office Supplies' },
        { name: 'Furniture' },
        { name: 'IT Equipment' },
        { name: 'Consumables' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ Created ${categories.count} categories`);

    // Get created categories for product creation
    const electronicsCategory = await prisma.productCategory.findFirst({ where: { name: 'Electronics' } });
    const officeCategory = await prisma.productCategory.findFirst({ where: { name: 'Office Supplies' } });
    const furnitureCategory = await prisma.productCategory.findFirst({ where: { name: 'Furniture' } });
    const itCategory = await prisma.productCategory.findFirst({ where: { name: 'IT Equipment' } });
    const consumablesCategory = await prisma.productCategory.findFirst({ where: { name: 'Consumables' } });

    // Create products
    const products = [
      // Electronics
      {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        description: 'Ergonomic wireless mouse with USB receiver',
        categoryId: electronicsCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 50,
        reorderQuantity: 500
      },
      {
        name: 'USB-C Cable 6ft',
        sku: 'UC-002',
        description: 'High-speed USB-C to USB-A cable, 6 feet length',
        categoryId: electronicsCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 100,
        reorderQuantity: 1000
      },
      {
        name: 'Bluetooth Headphones',
        sku: 'BH-003',
        description: 'Noise-cancelling Bluetooth headphones',
        categoryId: electronicsCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 20,
        reorderQuantity: 200
      },
      // Office Supplies
      {
        name: 'A4 Copy Paper',
        sku: 'CP-004',
        description: '500 sheets white A4 copy paper, 80gsm',
        categoryId: officeCategory.id,
        unitOfMeasure: 'ream',
        reorderLevel: 100,
        reorderQuantity: 1000
      },
      {
        name: 'Blue Ballpoint Pen',
        sku: 'BP-005',
        description: 'Medium tip blue ballpoint pen',
        categoryId: officeCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 200,
        reorderQuantity: 2000
      },
      {
        name: 'Stapler',
        sku: 'ST-006',
        description: 'Heavy-duty desktop stapler',
        categoryId: officeCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 10,
        reorderQuantity: 100
      },
      // IT Equipment
      {
        name: 'Laptop Stand',
        sku: 'LS-007',
        description: 'Adjustable aluminum laptop stand',
        categoryId: itCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 15,
        reorderQuantity: 150
      },
      {
        name: 'External Hard Drive 1TB',
        sku: 'HD-008',
        description: 'Portable USB 3.0 external hard drive, 1TB capacity',
        categoryId: itCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 25,
        reorderQuantity: 250
      },
      // Furniture
      {
        name: 'Office Chair',
        sku: 'OC-009',
        description: 'Ergonomic office chair with lumbar support',
        categoryId: furnitureCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 5,
        reorderQuantity: 50
      },
      {
        name: 'Desk Lamp',
        sku: 'DL-010',
        description: 'LED desk lamp with adjustable brightness',
        categoryId: furnitureCategory.id,
        unitOfMeasure: 'piece',
        reorderLevel: 20,
        reorderQuantity: 200
      }
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: product
      });
    }
    console.log(`✅ Created ${products.length} products`);

    // Create warehouses
    const warehouses = [
      {
        name: 'Main Warehouse',
        code: 'MW01',
        address: '1000 Storage Way, Distribution City, TX 75001'
      },
      {
        name: 'North Distribution Center',
        code: 'NDC02',
        address: '500 Northern Blvd, Northville, NY 10001'
      },
      {
        name: 'West Coast Facility',
        code: 'WCF03',
        address: '2000 Pacific Drive, Los Angeles, CA 90001'
      }
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
      { name: 'A-01-01', code: 'MW-A-01-01', warehouseId: mainWarehouse.id, type: 'STORAGE' },
      { name: 'A-01-02', code: 'MW-A-01-02', warehouseId: mainWarehouse.id, type: 'STORAGE' },
      { name: 'A-02-01', code: 'MW-A-02-01', warehouseId: mainWarehouse.id, type: 'STORAGE' },
      { name: 'B-01-01', code: 'MW-B-01-01', warehouseId: mainWarehouse.id, type: 'STORAGE' },
      { name: 'Receiving Bay 1', code: 'MW-REC-01', warehouseId: mainWarehouse.id, type: 'RECEIVING' },
      { name: 'Shipping Dock 1', code: 'MW-SHIP-01', warehouseId: mainWarehouse.id, type: 'SHIPPING' },
      
      // North Distribution Center locations
      { name: 'Zone A-1', code: 'NDC-A-01', warehouseId: northWarehouse.id, type: 'STORAGE' },
      { name: 'Zone A-2', code: 'NDC-A-02', warehouseId: northWarehouse.id, type: 'STORAGE' },
      { name: 'Zone B-1', code: 'NDC-B-01', warehouseId: northWarehouse.id, type: 'STORAGE' },
      { name: 'Receiving', code: 'NDC-REC-01', warehouseId: northWarehouse.id, type: 'RECEIVING' },
      
      // West Coast Facility locations
      { name: 'Section 1A', code: 'WCF-1A', warehouseId: westWarehouse.id, type: 'STORAGE' },
      { name: 'Section 1B', code: 'WCF-1B', warehouseId: westWarehouse.id, type: 'STORAGE' },
      { name: 'Section 2A', code: 'WCF-2A', warehouseId: westWarehouse.id, type: 'STORAGE' },
      { name: 'Quarantine', code: 'WCF-QUAR-01', warehouseId: westWarehouse.id, type: 'QUARANTINE' }
    ];

    for (const location of locations) {
      await prisma.location.upsert({
        where: { code: location.code },
        update: {},
        create: location
      });
    }
    console.log(`✅ Created ${locations.length} locations`);

    // Get some products and locations for stock creation
    const createdProducts = await prisma.product.findMany({ take: 10 });
    const createdLocations = await prisma.location.findMany();

    // Create initial stock levels
    const stockData = [];
    
    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      
      // Add stock in 2-3 different locations per product
      const locationsToStock = createdLocations.slice(i * 2, (i * 2) + 3);
      
      for (const location of locationsToStock) {
        const quantity = Math.floor(Math.random() * 200) + 50; // 50-250 items
        
        stockData.push({
          productId: product.id,
          locationId: location.id,
          quantity
        });
      }
    }

    for (const stock of stockData) {
      await prisma.stockLocation.upsert({
        where: {
          productId_locationId: {
            productId: stock.productId,
            locationId: stock.locationId
          }
        },
        update: {},
        create: {
          productId: stock.productId,
          locationId: stock.locationId,
          quantity: stock.quantity
        }
      });
    }
    console.log(`✅ Created ${stockData.length} stock locations`);

    // Create some sample stock ledger entries
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
          documentId: `DOC-${Date.now()}-${i}`, // Generate a dummy document ID
          movementType: randomMovementType,
          quantity: randomMovementType === 'OUT' ? -quantity : quantity,
          balanceBefore,
          balanceAfter,
          reference: `Initial stock ledger - ${randomDocumentType}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        }
      });
    }
    console.log('✅ Created 20 sample stock ledger entries');

    console.log('🎉 Seed completed successfully!');
    console.log(`
📊 Summary:
- Admin User: ${adminEmail} (password: admin123)
- ${warehouses.length} Warehouses
- ${locations.length} Locations
- ${products.length} Products
- ${stockData.length} Stock Locations
- 20 Stock Ledger Records
- 3 Suppliers
- 5 Categories

🚀 You can now start the application and test the inventory management features!
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