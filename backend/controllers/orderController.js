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
			paymentMethod, specialInstructions,
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
			specialInstructions,
			timeline: { placedAt: new Date() },
		});
		
		await order.populate('pump', 'name address owner');
		await order.populate('seeker', 'name phone');
		
		emitTo(req, pump.owner, 'order:new', { order });
		
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

exports.getAgentOrders = async (req, res) => {
	try {
		const orders = await Order.find({ deliveryAgent: req.user.id })
						.populate('seeker', 'name phone')
						.populate('pump', 'name address')
						.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			orders
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch agent orders'
		});
	}
}

exports.updateOrderStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, agentId } = req.body;

		const allowedStatuses = ['accepted', 'rejected', 'assigned', 'en_route', 'delivered', 'cancelled'];
		if (!allowedStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid status'
			});
		}

		const order = await Order.findById(id).populate('pump', 'owner');
		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Order not found'
			});
		}

		// Pump owner can accept/reject/assign. Agent can move delivery progress.
		const isPumpOwner = order.pump?.owner?.toString() === req.user.id;
		const isAssignedAgent = order.deliveryAgent?.toString() === req.user.id;
		const role = req.user.role;

		if (['accepted', 'rejected', 'assigned'].includes(status)) {
			if (!isPumpOwner && role !== 'pump_owner') {
				return res.status(403).json({
					success: false,
					message: 'Not authorized to update this order'
				});
			}
		}

		if (['en_route', 'delivered'].includes(status)) {
			if (!isAssignedAgent && role !== 'delivery_agent') {
				return res.status(403).json({
					success: false,
					message: 'Only assigned agent can update this status'
				});
			}
		}

		order.status = status;
		if (status === 'assigned' && agentId) {
			order.deliveryAgent = agentId;
		}

		order.timeline = {
			...order.timeline,
			...(status === 'accepted' && { acceptedAt: new Date() }),
			...(status === 'assigned' && { assignedAt: new Date() }),
			...(status === 'en_route' && { enRouteAt: new Date() }),
			...(status === 'delivered' && { deliveredAt: new Date() }),
			...(status === 'cancelled' && { cancelledAt: new Date() }),
		};

		await order.save();
		await order.populate('seeker', 'name phone');
		await order.populate('pump', 'name address owner');
		await order.populate('deliveryAgent', 'name phone');

		emitTo(req, order.seeker._id, 'order:statusUpdate', { order });
		if (order.pump?.owner) {
			emitTo(req, order.pump.owner, 'order:statusUpdate', { order });
		}
		if (order.deliveryAgent?._id) {
			emitTo(req, order.deliveryAgent._id, 'order:statusUpdate', { order });
		}

		return res.status(200).json({
			success: true,
			order
		});
	} catch (error) {
		console.error('updateOrderStatus error: ', error);
		return res.status(500).json({
			success: false,
			message: error.message || 'Failed to update order status'
		});
	}
}

exports.cancelOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const { reason } = req.body;

		const order = await Order.findById(id).populate('pump', 'name address owner');

		if (!order) return res.status(404).json({
			success: false,
			message: 'Order not found'
		});

		if (order.seeker.toString() !== req.user.id) return res.status(403).json({
			success: false,
			message: 'Not authorized to cancel this order'
		});

		if (!['pending', 'accepted'].includes(order.status)) {
			return res.status(400).json({
				success: false,
				message: 'Only pending or accepted orders can be cancelled'
			});
		}

		order.status = 'cancelled';
		order.cancellationReason = reason || 'Cancelled by customer';
		order.timeline = {
			...order.timeline,
			cancelledAt: new Date()
		};

		await order.save();
		await order.populate('deliveryAgent', 'name phone');

		// Notify pump owner so dashboard can update in real time.
		if (order.pump?.owner) {
			emitTo(req, order.pump.owner, 'order:statusUpdate', { order });
		}

		res.status(200).json({
			success: true,
			order
		});
	} catch (error) {
		console.error('cancelOrder error: ', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to cancel order'
		});
	}
}