const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20).regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  address: z.string().optional(),
});

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20).regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  warehouseId: z.string().cuid('Invalid warehouse ID'),
  type: z.enum(['STORAGE', 'PRODUCTION', 'RECEIVING', 'SHIPPING', 'DAMAGED', 'QUARANTINE']).default('STORAGE'),
});

// ========================================
// WAREHOUSE CONTROLLERS
// ========================================

const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            stockLocations: {
              include: {
                product: {
                  select: { name: true, sku: true }
                }
              }
            }
          }
        },
        _count: {
          select: { locations: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate total stock for each warehouse
    const warehousesWithStats = warehouses.map(warehouse => {
      const totalStock = warehouse.locations.reduce((total, location) => {
        return total + location.stockLocations.reduce((locTotal, stock) => locTotal + stock.quantity, 0);
      }, 0);

      const totalProducts = new Set(
        warehouse.locations.flatMap(location => 
          location.stockLocations.map(stock => stock.productId)
        )
      ).size;

      return {
        ...warehouse,
        stats: {
          totalStock,
          totalProducts,
          totalLocations: warehouse._count.locations
        }
      };
    });

    res.json({
      success: true,
      data: warehousesWithStats
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses'
    });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            stockLocations: {
              include: {
                product: {
                  select: { name: true, sku: true, unitOfMeasure: true }
                }
              }
            },
            _count: {
              select: { stockLocations: true }
            }
          }
        }
      }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse'
    });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const validation = warehouseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { name, code, address } = validation.data;

    // Check if warehouse with same code exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code }
    });

    if (existingWarehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse with this code already exists'
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code: code.toUpperCase(),
        address
      },
      include: {
        _count: {
          select: { locations: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: warehouse
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse'
    });
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = warehouseSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { name, code, address } = validation.data;

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id }
    });

    if (!existingWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if code conflicts with another warehouse
    if (code !== existingWarehouse.code) {
      const codeConflict = await prisma.warehouse.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (codeConflict) {
        return res.status(400).json({
          success: false,
          message: 'Another warehouse with this code already exists'
        });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        address
      },
      include: {
        _count: {
          select: { locations: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse'
    });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if warehouse has locations with stock
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            stockLocations: {
              where: {
                quantity: { gt: 0 }
              }
            }
          }
        }
      }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if any location has stock
    const hasStock = warehouse.locations.some(location => 
      location.stockLocations.length > 0
    );

    if (hasStock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with existing stock. Please move or adjust stock first.'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete warehouse'
    });
  }
};

// ========================================
// LOCATION CONTROLLERS
// ========================================

const getAllLocations = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    
    const whereClause = {
      isActive: true
    };
    
    if (warehouseId) {
      whereClause.warehouseId = warehouseId;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        warehouse: {
          select: { name: true, code: true }
        },
        stockLocations: {
          include: {
            product: {
              select: { name: true, sku: true, unitOfMeasure: true }
            }
          }
        },
        _count: {
          select: { stockLocations: true }
        }
      },
      orderBy: [
        { warehouse: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    // Calculate stats for each location
    const locationsWithStats = locations.map(location => {
      const totalStock = location.stockLocations.reduce((total, stock) => total + stock.quantity, 0);
      const totalProducts = location.stockLocations.length;

      return {
        ...location,
        stats: {
          totalStock,
          totalProducts
        }
      };
    });

    res.json({
      success: true,
      data: locationsWithStats
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations'
    });
  }
};

const createLocation = async (req, res) => {
  try {
    const validation = locationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { name, code, warehouseId, type } = validation.data;

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if location code is unique
    const existingLocation = await prisma.location.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location with this code already exists'
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        code: code.toUpperCase(),
        warehouseId,
        type
      },
      include: {
        warehouse: {
          select: { name: true, code: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: location
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location'
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const validation = locationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { name, code, warehouseId, type } = validation.data;

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id }
    });

    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId }
    });

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if code conflicts with another location
    if (code.toUpperCase() !== existingLocation.code) {
      const codeConflict = await prisma.location.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (codeConflict) {
        return res.status(400).json({
          success: false,
          message: 'Another location with this code already exists'
        });
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        code: code.toUpperCase(),
        warehouseId,
        type
      },
      include: {
        warehouse: {
          select: { name: true, code: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location'
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location has stock
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        stockLocations: {
          where: {
            quantity: { gt: 0 }
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    if (location.stockLocations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location with existing stock. Please move or adjust stock first.'
      });
    }

    // Soft delete by setting isActive to false
    await prisma.location.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location'
    });
  }
};

module.exports = {
  // Warehouse controllers
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  
  // Location controllers
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation
};