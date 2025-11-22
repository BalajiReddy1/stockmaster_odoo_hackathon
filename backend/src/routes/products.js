const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all products
router.get('/', authenticate, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        stockLocations: {
          include: {
            location: {
              include: {
                warehouse: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate total stock for each product
    const productsWithStock = products.map(product => ({
      ...product,
      totalStock: product.stockLocations.reduce((sum, sl) => sum + sl.quantity, 0),
      totalAvailable: product.stockLocations.reduce((sum, sl) => sum + sl.available, 0)
    }));

    res.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockLocations: {
          include: {
            location: {
              include: {
                warehouse: true
              }
            }
          }
        },
        stockLedger: {
          include: {
            location: true
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      name, 
      sku, 
      description, 
      categoryId, 
      unitOfMeasure,
      initialStock,
      reorderLevel,
      reorderQuantity
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: 'Name and SKU are required' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description || null,
        categoryId: categoryId || null,
        unitOfMeasure: unitOfMeasure || 'unit',
        initialStock: initialStock ? parseFloat(initialStock) : 0,
        reorderLevel: reorderLevel ? parseFloat(reorderLevel) : null,
        reorderQuantity: reorderQuantity ? parseFloat(reorderQuantity) : null
      },
      include: {
        category: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Product SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      sku, 
      description, 
      categoryId, 
      unitOfMeasure,
      reorderLevel,
      reorderQuantity,
      isActive
    } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description: description || null,
        categoryId: categoryId || null,
        unitOfMeasure,
        reorderLevel: reorderLevel ? parseFloat(reorderLevel) : null,
        reorderQuantity: reorderQuantity ? parseFloat(reorderQuantity) : null,
        isActive
      },
      include: {
        category: true
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
