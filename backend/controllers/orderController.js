const Order = require('../models/Order');
const Pump = require('../models/Pump');
const User = require('../models/User');

const emitTo = (req, userId, event, data) => {
	const io = req.app.get('io');
	io.to(userId.toString()).emit(event, data);
};

exports.placeOrder = async (req, res) => {
	try {
		const {
			pumpId, fuelType, quantityLitres,
			deliveryLocation, deliveryAddress,
			paymentMethod, specialInstructinos,
		} = req.body;
		
		const pump = await Pump.findById(pumpId);
		
		if(!pump) return res.status(404).json({
			success: false,
			message: 'Pump not found'
		});
		
		if(!pump.isActive) return res.status(400).json({
			success: false,
			message: 'Pump is not active'
		});
		
		if(!pump.offersDelivery) return res.status(400).json({
			success: false,
			message: 'This pump does not offer delivery'
		});
		
		const fuelEntry = pump.fuelStock.find((f) => f.fuelType === fuelType && f.isAvailable);
		
		console.log(fuelEntry);
		
		if(!fuelEntry) return res.status(400).json({
			success: false,
			message: `${fuelType} is not available at this pump`
		});
		
		if(fuelEntry.availableLitres < quantityLitres) {
			return res.status(400).json({
				success: false,
				message: `Only ${fuelEntry.availableLitres}L available`
			});
		}
		
		if(quantityLitres < pump.minimumDeliveryLitres) {
			return res.status(400).json({
				success: false,
				message: `Minimum order is ${pump.minimumDeliveryLitres}`
			});
		}
		
		const totalAmount = fuelEntry.pricePerLitre * quantityLitres + pump.deliveryCharge;
		
		const order = await Order.create({
			seeker: req.user.id,
			pump: pumpId,
			fuelType,
			quantityLitres,
			pricePerLitre: fuelEntry.pricePerLitre,
			deliveryCharge: pump.deliveryCharge,
			totalAmount,
			deliveryLocation,
			deliveryAddress,
			paymentMethod: paymentMethod || 'cash',
			specialInstructinos,
			timeline: { placedAt: new Date() },
		});
		
		await order.populate('pump', 'name address owner');
		await order.populate('seeker', 'name phone');
		
		emitTo(req, pump.owner, 'order: new', { order });
		
		res.status(201).json({
			success: true,
			order
		});
	} catch(error) {
		console.error('placeOrder error: ', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to place order'
		});
	}
}

exports.getMyOrders = async (req, res) => {
	try {
		const orders = await Order.find({ seeker: req.user.id })
						.populate('pump', 'name address')
						.populate('deliveryAgent', 'name phone')
						.sort({ createdAt: -1 });
		res.status(200).json({
			success: true,
			orders
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch orders!'
		});
	}
}

exports.getPumpOrders = async (req, res) => {
	try {
		const pump = await Pump.findOne({ owner: req.user.id });

		if(!pump) return res.status(404).json({
			success: false,
			message: 'No pump found'
		});
		
		const orders = await Order.find({ pump: pump._id })
						.populate('seeker', 'name phone')
						.populate('deliveryAgent', 'name phone')
						.sort({ createdAt: -1 });
		
		res.status(200).json({
			success: true,
			orders
		});
	} catch(error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch pump orders'
		});
	}
}