const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Generate delivery number
const generateDeliveryNumber = async () => {
  const prefix = 'WH/OUT/';
  const lastDelivery = await prisma.deliveryOrder.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { deliveryNumber: true }
  });

  if (!lastDelivery) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastDelivery.deliveryNumber.split('/').pop());
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `${prefix}${newNumber}`;
};

// Get all deliveries
router.get('/', authenticate, async (req, res) => {
  try {
    const deliveries = await prisma.deliveryOrder.findMany({
      include: {
        customer: true,
        location: {
          include: {
            warehouse: true
          }
        },
        lines: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// Get delivery by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        location: {
          include: {
            warehouse: true
          }
        },
        lines: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

// Create new delivery
router.post('/', authenticate, async (req, res) => {
  try {
    const { customerId, locationId, scheduledDate, notes, lines } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!locationId || !lines || lines.length === 0) {
      return res.status(400).json({ 
        error: 'Location and at least one line item are required' 
      });
    }

    // Generate delivery number
    const deliveryNumber = await generateDeliveryNumber();

    // Create delivery with lines in a transaction
    const delivery = await prisma.$transaction(async (tx) => {
      // Create delivery order
      const newDelivery = await tx.deliveryOrder.create({
        data: {
          deliveryNumber,
          customerId: customerId || null,
          locationId,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          notes,
          userId,
          status: 'DRAFT',
          lines: {
            create: lines.map(line => ({
              productId: line.productId,
              quantity: parseFloat(line.quantity),
              picked: 0,
              packed: 0,
              delivered: 0,
              notes: line.notes || null
            }))
          }
        },
        include: {
          customer: true,
          location: true,
          lines: {
            include: {
              product: true
            }
          }
        }
      });

      return newDelivery;
    });

    res.status(201).json(delivery);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

// Update delivery status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const delivery = await prisma.deliveryOrder.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        location: true,
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

// Pick items
router.post('/:id/pick', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.$transaction(async (tx) => {
      // Get delivery with lines
      const existingDelivery = await tx.deliveryOrder.findUnique({
        where: { id },
        include: { lines: true }
      });

      if (!existingDelivery) {
        throw new Error('Delivery not found');
      }

      if (existingDelivery.status !== 'WAITING') {
        throw new Error('Delivery must be in WAITING status to pick items');
      }

      // Update all lines to picked = quantity
      await Promise.all(
        existingDelivery.lines.map(line =>
          tx.deliveryOrderLine.update({
            where: { id: line.id },
            data: { picked: line.quantity }
          })
        )
      );

      // Update delivery status to READY
      return await tx.deliveryOrder.update({
        where: { id },
        data: { status: 'READY' },
        include: {
          customer: true,
          location: true,
          lines: {
            include: {
              product: true
            }
          }
        }
      });
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error picking items:', error);
    res.status(500).json({ error: error.message || 'Failed to pick items' });
  }
});

// Pack items
router.post('/:id/pack', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.$transaction(async (tx) => {
      // Get delivery with lines
      const existingDelivery = await tx.deliveryOrder.findUnique({
        where: { id },
        include: { lines: true }
      });

      if (!existingDelivery) {
        throw new Error('Delivery not found');
      }

      if (existingDelivery.status !== 'WAITING' && existingDelivery.status !== 'READY') {
        throw new Error('Delivery must be in WAITING or READY status to pack items');
      }

      // Update all lines to packed = picked
      await Promise.all(
        existingDelivery.lines.map(line =>
          tx.deliveryOrderLine.update({
            where: { id: line.id },
            data: { 
              packed: line.picked > 0 ? line.picked : line.quantity,
              picked: line.picked > 0 ? line.picked : line.quantity
            }
          })
        )
      );

      // Update delivery status to READY
      return await tx.deliveryOrder.update({
        where: { id },
        data: { status: 'READY' },
        include: {
          customer: true,
          location: true,
          lines: {
            include: {
              product: true
            }
          }
        }
      });
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error packing items:', error);
    res.status(500).json({ error: error.message || 'Failed to pack items' });
  }
});

// Validate delivery (reduces stock)
router.post('/:id/validate', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.$transaction(async (tx) => {
      // Get delivery with lines
      const existingDelivery = await tx.deliveryOrder.findUnique({
        where: { id },
        include: { 
          lines: {
            include: {
              product: true
            }
          },
          location: true
        }
      });

      if (!existingDelivery) {
        throw new Error('Delivery not found');
      }

      if (existingDelivery.status !== 'READY') {
        throw new Error('Delivery must be in READY status to validate');
      }

      // Process each line
      for (const line of existingDelivery.lines) {
        const quantityToDeliver = line.packed > 0 ? line.packed : line.quantity;

        // Update delivered quantity
        await tx.deliveryOrderLine.update({
          where: { id: line.id },
          data: { delivered: quantityToDeliver }
        });

        // Get or create stock location
        let stockLocation = await tx.stockLocation.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: existingDelivery.locationId
            }
          }
        });

        if (!stockLocation) {
          // If stock location doesn't exist, create one with 0 quantity
          stockLocation = await tx.stockLocation.create({
            data: {
              productId: line.productId,
              locationId: existingDelivery.locationId,
              quantity: 0,
              reserved: 0,
              available: 0
            }
          });
        }

        const balanceBefore = stockLocation.quantity;
        const newQuantity = Math.max(0, balanceBefore - quantityToDeliver);
        const newAvailable = Math.max(0, newQuantity - stockLocation.reserved);

        // Update stock location
        await tx.stockLocation.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: existingDelivery.locationId
            }
          },
          data: {
            quantity: newQuantity,
            available: newAvailable
          }
        });

        // Create stock ledger entry
        await tx.stockLedger.create({
          data: {
            productId: line.productId,
            locationId: existingDelivery.locationId,
            documentType: 'DELIVERY',
            documentId: id,
            movementType: 'OUT',
            quantity: quantityToDeliver,
            balanceBefore,
            balanceAfter: newQuantity,
            reference: existingDelivery.deliveryNumber
          }
        });
      }

      // Update delivery status to DONE
      return await tx.deliveryOrder.update({
        where: { id },
        data: { 
          status: 'DONE',
          deliveredDate: new Date()
        },
        include: {
          customer: true,
          location: true,
          lines: {
            include: {
              product: true
            }
          }
        }
      });
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error validating delivery:', error);
    res.status(500).json({ error: error.message || 'Failed to validate delivery' });
  }
});

// Update delivery
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, locationId, scheduledDate, notes, status } = req.body;

    const delivery = await prisma.deliveryOrder.update({
      where: { id },
      data: {
        customerId: customerId || null,
        locationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        notes,
        status
      },
      include: {
        customer: true,
        location: true,
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
});

// Delete delivery
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if delivery can be deleted
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id }
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({ 
        error: 'Cannot delete a completed delivery' 
      });
    }

    // Delete delivery (cascade will delete lines)
    await prisma.deliveryOrder.delete({
      where: { id }
    });

    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

module.exports = router;
