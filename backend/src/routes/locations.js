const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all locations
router.get('/', authenticate, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        warehouse: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get location by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        stockLocations: {
          include: {
            product: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// Create new location
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, warehouseId, type } = req.body;

    if (!name || !code || !warehouseId) {
      return res.status(400).json({ 
        error: 'Name, code, and warehouse are required' 
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        code,
        warehouseId,
        type: type || 'STORAGE'
      },
      include: {
        warehouse: true
      }
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Location code already exists' });
    }
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Update location
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, warehouseId, type, isActive } = req.body;

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        code,
        warehouseId,
        type,
        isActive
      },
      include: {
        warehouse: true
      }
    });

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Delete location
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.location.delete({
      where: { id }
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

module.exports = router;
