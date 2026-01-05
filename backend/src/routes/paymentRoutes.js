const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// User routes
router.post('/create', protect, paymentController.createPaymentRequest);
router.post('/submit', protect, paymentController.submitPaymentConfirmation);
router.get('/my-payments', protect, paymentController.getUserPayments);
router.get('/:paymentId', protect, paymentController.getPaymentById);

// Admin routes
router.get('/admin/all', protect, paymentController.getAllPayments);
router.put('/admin/verify/:paymentId', protect, paymentController.verifyPayment);

module.exports = router;
