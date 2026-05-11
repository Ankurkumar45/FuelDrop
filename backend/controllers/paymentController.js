const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = () => {
	if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
		throw new Error('Razorpay keys missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your env file.');
	}

	return new Razorpay({
		key_id: process.env.RAZORPAY_KEY_ID,
		key_secret: process.env.RAZORPAY_KEY_SECRET
	});
}

// Creates a Razorpay order for an existing FuelDrop order
exports.createRazorpayOrder = async (req, res) => {
	try {
		const order = await Order.findById(req.params.orderId);
		if (!order) return res.status(404).json({
			success: false,
			message: 'Order not found!'
		});

		if (order.paymentStatus === 'paid') {
			return res.status(400).json({
				success: false,
				message: 'Order already paid!'
			});
		}

		// Razorpay amount is in paise (1 INR = 100 paise)
		const razorpayOrder = await razorpay().orders.create({
			amount: Math.round(order.totalAmount * 100),
			currency: 'INR',
			receipt: `fd_${order._id.toString().slice(-8)}`,
			notes: { fueldropOrderId: order._id.toString() },
		});

		// Save Razorpay order ID to our order
		order.razorpayOrderId = razorpayOrder.id;
		await order.save();

		res.status(200).json({
			success: true,
			razorpayOrderId: razorpayOrder.id,
			amount: razorpayOrder.amount,
			currency: razorpayOrder.currency,
			keyId: process.env.RAZORPAY_KEY_ID,
		});
	} catch (error) {
		console.error('createRazorpayOrder error: ', error);
		res.status(500).json({
			success: false,
			message: 'Failed to create payment order'
		});
	}
}

// Verifies Razorpay payment and updates order status
exports.verifyPayment = async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

		const expectedSignature = crypto
			.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
			.update(`${razorpay_order_id}|${razorpay_payment_id}`)
			.digest('hex');

		console.log(expectedSignature);

		if (expectedSignature !== razorpay_signature) {
			return res.status(400).json({
				success: false,
				message: 'Invalid payment signature'
			});
		}

		const order = await Order.findById(req.params.orderId);
		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		order.razorpayPaymentId = razorpay_payment_id;
		order.paymentStatus = 'paid';
		await order.save();

		const io = req.app.get('io');
		io.to(order.seeker.toString()).emit('payment: confirmed ', { orderId: order._id });

		res.status(200).json({
			success: true,
			message: 'Payment verified successfully',
			order,
		});
	} catch (error) {
		console.error('verifyPayment error: ', error);
		res.status(500).json({
			success: false,
			message: 'Failed to verify payment'
		});
	}
}