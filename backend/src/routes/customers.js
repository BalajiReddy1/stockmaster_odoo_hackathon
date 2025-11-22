const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all customers
router.get('/', authenticate, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        deliveries: {
          include: {
            lines: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create new customer
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, email, phone, address } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        code,
        email: email || null,
        phone: phone || null,
        address: address || null
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, email, phone, address, isActive } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name,
        code,
        email: email || null,
        phone: phone || null,
        address: address || null,
        isActive
      }
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;
