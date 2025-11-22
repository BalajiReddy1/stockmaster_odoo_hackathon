const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const stockAdjustmentSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  locationId: z.string().cuid('Invalid location ID'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  adjustmentType: z.enum(['INCREASE', 'DECREASE', 'SET']),
  reason: z.string().optional(),
  cost: z.number().optional()
});

const stockTransferSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  fromLocationId: z.string().cuid('Invalid from location ID'),
  toLocationId: z.string().cuid('Invalid to location ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1')
});

const stockReceiptSchema = z.object({
  supplierId: z.string().cuid('Invalid supplier ID'),
  items: z.array(z.object({
    productId: z.string().cuid('Invalid product ID'),
    locationId: z.string().cuid('Invalid location ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitCost: z.number().min(0, 'Unit cost must be non-negative'),
    expiryDate: z.string().datetime().optional()
  })).min(1, 'At least one item is required')
});

// ========================================
// STOCK OVERVIEW CONTROLLERS
// ========================================

const getStockOverview = async (req, res) => {
  try {
    const { warehouseId, locationId, productId, lowStock } = req.query;
    
    let whereClause = {
      location: {
        isActive: true,
        warehouse: {
          isActive: true
        }
      },
      product: {
        isActive: true
      }
    };

    if (warehouseId) {
      whereClause.location.warehouseId = warehouseId;
    }

    if (locationId) {
      whereClause.locationId = locationId;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    const stockLocations = await prisma.stockLocation.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
            unitOfMeasure: true,
            reorderLevel: true,
            reorderQuantity: true
          }
        },
        location: {
          select: {
            name: true,
            code: true,
            type: true,
            warehouse: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: [
        { location: { warehouse: { name: 'asc' } } },
        { location: { name: 'asc' } },
        { product: { name: 'asc' } }
      ]
    });

    // Filter for low stock if requested
    let filteredStockLocations = stockLocations;
    if (lowStock === 'true') {
      filteredStockLocations = stockLocations.filter(stock => 
        stock.quantity <= (stock.product.reorderLevel || 0)
      );
    }

    // Calculate stock statistics
    const totalProducts = new Set(stockLocations.map(stock => stock.productId)).size;
    const totalStock = stockLocations.reduce((sum, stock) => sum + stock.quantity, 0);
    const lowStockItems = stockLocations.filter(stock => 
      stock.quantity <= (stock.product.reorderLevel || 0)
    ).length;

    res.json({
      success: true,
      data: {
        stockLocations: filteredStockLocations,
        statistics: {
          totalProducts,
          totalStock,
          lowStockItems,
          totalLocations: new Set(stockLocations.map(stock => stock.locationId)).size
        }
      }
    });
  } catch (error) {
    console.error('Get stock overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock overview'
    });
  }
};

const getProductStock = async (req, res) => {
  try {
    const { productId } = req.params;

    const productStock = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockLocations: {
          where: {
            quantity: { gt: 0 },
            location: {
              isActive: true,
              warehouse: { isActive: true }
            }
          },
          include: {
            location: {
              include: {
                warehouse: {
                  select: { name: true, code: true }
                }
              }
            }
          }
        }
      }
    });

    if (!productStock) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const totalStock = productStock.stockLocations.reduce((sum, stock) => sum + stock.quantity, 0);

    res.json({
      success: true,
      data: {
        product: productStock,
        totalStock,
        locations: productStock.stockLocations
      }
    });
  } catch (error) {
    console.error('Get product stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product stock'
    });
  }
};

// ========================================
// STOCK ADJUSTMENT CONTROLLERS
// ========================================

const adjustStock = async (req, res) => {
  try {
    const validation = stockAdjustmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { productId, locationId, quantity, adjustmentType, reason, cost } = validation.data;

    // Verify product and location exist
    const [product, location] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.location.findUnique({ where: { id: locationId } })
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Get current stock
    const currentStock = await prisma.stockLocation.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId
        }
      }
    });

    const currentQuantity = currentStock?.quantity || 0;
    let newQuantity;

    switch (adjustmentType) {
      case 'INCREASE':
        newQuantity = currentQuantity + quantity;
        break;
      case 'DECREASE':
        newQuantity = Math.max(0, currentQuantity - quantity);
        break;
      case 'SET':
        newQuantity = quantity;
        break;
    }

    // Update or create stock location
    const updatedStock = await prisma.stockLocation.upsert({
      where: {
        productId_locationId: {
          productId,
          locationId
        }
      },
      update: {
        quantity: newQuantity,
        lastUpdated: new Date()
      },
      create: {
        productId,
        locationId,
        quantity: newQuantity,
        averageCost: cost || 0
      },
      include: {
        product: {
          select: { name: true, sku: true }
        },
        location: {
          select: { name: true, code: true }
        }
      }
    });

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        productId,
        locationId,
        movementType: 'ADJUSTMENT',
        quantity: adjustmentType === 'DECREASE' ? -Math.min(quantity, currentQuantity) : 
                 adjustmentType === 'INCREASE' ? quantity : 
                 newQuantity - currentQuantity,
        previousQuantity: currentQuantity,
        newQuantity,
        reason,
        unitCost: cost,
        userId: req.user?.id
      }
    });

    res.json({
      success: true,
      message: `Stock ${adjustmentType.toLowerCase()} completed successfully`,
      data: updatedStock
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock'
    });
  }
};

const transferStock = async (req, res) => {
  try {
    const validation = stockTransferSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { productId, fromLocationId, toLocationId, quantity } = validation.data;

    if (fromLocationId === toLocationId) {
      return res.status(400).json({
        success: false,
        message: 'From and to locations cannot be the same'
      });
    }

    // Get current stock at source location
    const sourceStock = await prisma.stockLocation.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId: fromLocationId
        }
      }
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock at source location'
      });
    }

    // Perform the transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Decrease stock at source location
      const updatedSourceStock = await tx.stockLocation.update({
        where: {
          productId_locationId: {
            productId,
            locationId: fromLocationId
          }
        },
        data: {
          quantity: sourceStock.quantity - quantity,
          lastUpdated: new Date()
        }
      });

      // Increase stock at destination location
      const updatedDestStock = await tx.stockLocation.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId: toLocationId
          }
        },
        update: {
          quantity: { increment: quantity },
          lastUpdated: new Date()
        },
        create: {
          productId,
          locationId: toLocationId,
          quantity,
          averageCost: sourceStock.averageCost || 0
        }
      });

      // Create stock movement records
      await tx.stockMovement.createMany({
        data: [
          {
            productId,
            locationId: fromLocationId,
            movementType: 'TRANSFER_OUT',
            quantity: -quantity,
            previousQuantity: sourceStock.quantity,
            newQuantity: sourceStock.quantity - quantity,
            reason: `Transfer to ${toLocationId}`,
            unitCost: sourceStock.averageCost,
            userId: req.user?.id
          },
          {
            productId,
            locationId: toLocationId,
            movementType: 'TRANSFER_IN',
            quantity: quantity,
            previousQuantity: updatedDestStock.quantity - quantity,
            newQuantity: updatedDestStock.quantity,
            reason: `Transfer from ${fromLocationId}`,
            unitCost: sourceStock.averageCost,
            userId: req.user?.id
          }
        ]
      });

      return { updatedSourceStock, updatedDestStock };
    });

    res.json({
      success: true,
      message: 'Stock transfer completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Stock transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer stock'
    });
  }
};

// ========================================
// STOCK RECEIPT CONTROLLERS
// ========================================

const receiveStock = async (req, res) => {
  try {
    const validation = stockReceiptSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { supplierId, items } = validation.data;

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create receipt record
      const receipt = await tx.receipt.create({
        data: {
          supplierId,
          status: 'COMPLETED',
          receivedAt: new Date(),
          userId: req.user?.id
        }
      });

      // Process each item
      const receiptItems = [];
      for (const item of items) {
        // Create receipt item
        const receiptItem = await tx.receiptItem.create({
          data: {
            receiptId: receipt.id,
            productId: item.productId,
            locationId: item.locationId,
            quantityOrdered: item.quantity,
            quantityReceived: item.quantity,
            unitCost: item.unitCost,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
          }
        });

        // Update stock location
        await tx.stockLocation.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: item.locationId
            }
          },
          update: {
            quantity: { increment: item.quantity },
            averageCost: item.unitCost, // Simplified - should calculate weighted average
            lastUpdated: new Date()
          },
          create: {
            productId: item.productId,
            locationId: item.locationId,
            quantity: item.quantity,
            averageCost: item.unitCost
          }
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            locationId: item.locationId,
            movementType: 'RECEIPT',
            quantity: item.quantity,
            previousQuantity: 0, // Would need to query actual previous quantity
            newQuantity: item.quantity, // Would need to calculate actual new quantity
            reason: `Receipt from ${supplier.name}`,
            unitCost: item.unitCost,
            userId: req.user?.id,
            receiptId: receipt.id
          }
        });

        receiptItems.push(receiptItem);
      }

      return { receipt, receiptItems };
    });

    res.status(201).json({
      success: true,
      message: 'Stock receipt processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Stock receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process stock receipt'
    });
  }
};

module.exports = {
  getStockOverview,
  getProductStock,
  adjustStock,
  transferStock,
  receiveStock
};