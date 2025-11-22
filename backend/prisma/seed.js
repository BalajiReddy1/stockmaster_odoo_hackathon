require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
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
  console.log('✅ User created:', user.email);

  // Create warehouse
  let warehouse = await prisma.warehouse.findFirst({
    where: { OR: [{ code: 'WH-STOCK1' }, { name: 'Main Warehouse' }] },
  });
  
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        code: 'WH-STOCK1',
        address: '123 Warehouse Street, City',
        isActive: true,
      },
    });
    console.log('✅ Warehouse created:', warehouse.name);
  } else {
    console.log('✅ Warehouse exists:', warehouse.name);
  }

  // Create locations
  const location = await prisma.location.upsert({
    where: { code: 'WH/Stock1' },
    update: {},
    create: {
      name: 'Stock Location 1',
      code: 'WH/Stock1',
      warehouseId: warehouse.id,
      type: 'STORAGE',
      isActive: true,
    },
  });
  console.log('✅ Location created:', location.name);

  // Create customers
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

  // Create product category
  const category = await prisma.productCategory.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: {
      name: 'Furniture',
      description: 'Office and home furniture',
    },
  });
  console.log('✅ Category created:', category.name);

  // Create products
  const desk = await prisma.product.upsert({
    where: { sku: 'DESK001' },
    update: {},
    create: {
      name: 'Desk',
      sku: 'DESK001',
      description: 'Office desk with drawers',
      categoryId: category.id,
      unitOfMeasure: 'unit',
      initialStock: 50,
      reorderLevel: 10,
      reorderQuantity: 20,
      isActive: true,
    },
  });
  console.log('✅ Product created:', desk.name);

  const chair = await prisma.product.upsert({
    where: { sku: 'CHAIR001' },
    update: {},
    create: {
      name: 'Office Chair',
      sku: 'CHAIR001',
      description: 'Ergonomic office chair',
      categoryId: category.id,
      unitOfMeasure: 'unit',
      initialStock: 100,
      reorderLevel: 20,
      reorderQuantity: 50,
      isActive: true,
    },
  });
  console.log('✅ Product created:', chair.name);

  const table = await prisma.product.upsert({
    where: { sku: 'TABLE001' },
    update: {},
    create: {
      name: 'Conference Table',
      sku: 'TABLE001',
      description: 'Large conference table',
      categoryId: category.id,
      unitOfMeasure: 'unit',
      initialStock: 15,
      reorderLevel: 5,
      reorderQuantity: 10,
      isActive: true,
    },
  });
  console.log('✅ Product created:', table.name);

  // Create stock locations for products
  await prisma.stockLocation.upsert({
    where: {
      productId_locationId: {
        productId: desk.id,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      productId: desk.id,
      locationId: location.id,
      quantity: 50,
      reserved: 0,
      available: 50,
    },
  });

  await prisma.stockLocation.upsert({
    where: {
      productId_locationId: {
        productId: chair.id,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      productId: chair.id,
      locationId: location.id,
      quantity: 100,
      reserved: 0,
      available: 100,
    },
  });

  await prisma.stockLocation.upsert({
    where: {
      productId_locationId: {
        productId: table.id,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      productId: table.id,
      locationId: location.id,
      quantity: 15,
      reserved: 0,
      available: 15,
    },
  });
  console.log('✅ Stock locations created');

  // Create delivery orders
  const delivery1 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'WH/OUT/0001',
      customerId: customer.id,
      locationId: location.id,
      status: 'READY',
      scheduledDate: new Date('2025-11-25'),
      notes: 'Urgent delivery for Azure Interior',
      userId: user.id,
      lines: {
        create: [
          {
            productId: desk.id,
            quantity: 6,
            picked: 6,
            packed: 6,
            delivered: 0,
            notes: 'Handle with care',
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });
  console.log('✅ Delivery order created:', delivery1.deliveryNumber);

  const delivery2 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'WH/OUT/0002',
      customerId: customer.id,
      locationId: location.id,
      status: 'WAITING',
      scheduledDate: new Date('2025-11-26'),
      notes: 'Regular delivery',
      userId: user.id,
      lines: {
        create: [
          {
            productId: chair.id,
            quantity: 20,
            picked: 0,
            packed: 0,
            delivered: 0,
          },
          {
            productId: table.id,
            quantity: 3,
            picked: 0,
            packed: 0,
            delivered: 0,
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });
  console.log('✅ Delivery order created:', delivery2.deliveryNumber);

  const delivery3 = await prisma.deliveryOrder.create({
    data: {
      deliveryNumber: 'WH/OUT/0003',
      customerId: customer.id,
      locationId: location.id,
      status: 'DRAFT',
      scheduledDate: new Date('2025-11-28'),
      notes: 'Pending approval',
      userId: user.id,
      lines: {
        create: [
          {
            productId: desk.id,
            quantity: 10,
            picked: 0,
            packed: 0,
            delivered: 0,
          },
        ],
      },
    },
    include: {
      lines: true,
    },
  });
  console.log('✅ Delivery order created:', delivery3.deliveryNumber);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Email: test@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
