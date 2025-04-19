const express = require('express');
const router = express.Router();
const deliveryService = require('../services/deliveryService');

router.post('/calculate-cost', (req, res) => {
    try {
        const order = req.body;
        
        // Validate order format
        if (!order || typeof order !== 'object' || Object.keys(order).length === 0) {
            return res.status(400).json({ error: 'Invalid order format' });
        }

        // Validate product quantities
        for (const [product, quantity] of Object.entries(order)) {
            if (typeof quantity !== 'number' || quantity <= 0) {
                return res.status(400).json({ error: `Invalid quantity for product ${product}` });
            }
        }

        const minimumCost = deliveryService.calculateMinimumCost(order);
        res.json({ minimum_cost: minimumCost });
    } catch (error) {
        console.error('Error calculating cost:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 