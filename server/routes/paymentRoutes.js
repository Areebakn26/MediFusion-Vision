const express = require('express');
const router = express.Router();
const {
    createPaymentIntent,
    confirmPayment,
    handleWebhook,
    processRefund,
    getPaymentHistory,
    getPaymentReceipt
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Webhook (no auth - Stripe verifies signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Payment management
router.post('/:id/refund', protect, processRefund);
router.get('/history', protect, getPaymentHistory);
router.get('/:id/receipt', protect, getPaymentReceipt);

module.exports = router;
