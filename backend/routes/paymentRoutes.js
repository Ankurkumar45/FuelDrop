const express = require('express');
const router = express.Router();

const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/create-order/:orderId', authorize('seeker'), createRazorpayOrder);
router.post('/verify-payment/:orderId', authorize('seeker'), verifyPayment);

module.exports = router;