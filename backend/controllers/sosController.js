const Sosalert = require('../models/Sosalert');
const Pump = require('../models/Pump');
const Order = require('../models/Order');

exports.createSos = async (req, res) => {
	try {
		const { latitude, longitude, fuelType, quantityNeeded, locationDescription } = req.body;
		
		await Sosalert.updateMany(
			{ seeker: req.user.id, status: 'active' },
			{ status: 'cancelled' }
		);
		
		const broadcastRadiusMetres = 10000;
		
		const nearbyPumps = await Pump.find({
			isActive: true,
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [parseFloat(longitude), parseFloat(latitude)]
					},
					$maxDistance: broadcastRadiusMetres,
				},
			},
			fuelStock: {
				$elemMatch: {
					fuelType,
					isAvailable: true,
					availableLitres: {
						$gte: quantityNeeded || 1
					},
				},
			},
		}).select('_id owner name').limit(15);
		
		const sos = await Sosalert.create({
			seeker: req.user.id,
			location: {
				type: 'Point',
				coordinates: [parseFloat(longitude), parseFloat(latitude)],
			},
			fuelType,
			quantityNeeded: quantityNeeded || 2,
			locationDescription,
			broadcastRadiusMetres,
			notifiedPumps: nearbyPumps.map((p) => ({ pump: p._id })),
		});
		
		await sos.populate('seeker', 'name phone');
		
		
		const io = req.app.get('io');
		nearbyPumps.forEach((pump) => {
			io.to(pump.owner.toString()).emit('sos: new', {
				sos: {
					_id: sos._id,
					seeker: sos.seeker,
					location: sos.location,
					fuelType: sos.fuelType,
					quantityNeeded: sos.quantityNeeded,
					locationDescription: sos.locationDescription,
					expiresAt: sos.expiresAt,
				},
			});
		});
		
		res.status(201).json({
			success: true,
			sos,
			notifiedPumpsCount: nearbyPumps.length,
		});
	} catch(error) {
		console.error('createSos error: ', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to create SOS alert!'
		});
	}
}

exports.getMySos = async (req, res) => {
	try {
		const alerts = await Sosalert.find({ seeker: req.user._id })
			.populate('respondingPump', 'name address')
			.populate('convertedToOrder')
			.sort({ createdAt: -1 })
			.limit(10);
		
		res.status(200).json({
			success: true,
			alerts
		});
		
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch SOS alerts'
		});
	}
}

exports.getIncomingSos = async (req, res) => {
	try {
		const pump = await Pump.findOne({ owner: req.user.id });
		if(!pump) return res.status(404).json({
			success: false,
			message: 'No pump found'
		});
		
		const alerts = await Sosalert.find({
			status: 'active',
			'notifiedPumps.pump': pump._id,
		})
			.populate('seeker', 'name phone')
			.sort({ createdAt: -1 });
		
		res.status(200).json({
			success: true,
			alerts
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch incoming SOS'
		});
	}
}

exports.respondToSos = async (req, res) => {
	try {
		const { response } = req.body;
		
		const pump = await Pump.findOne({ owner: req.user.id });
		if(!pump) return res.status(404).json({
			success: false,
			message: 'No pump found'
		});
		
		const sos = await Sosalert.findById(req.params.id).populate('seeker', 'name phone');
		if(!sos) return res.status(404).json({
			success: false,
			message: 'SOS alert not found'
		})
		
		if(sos.status !== 'active') {
			return res.status(400).json({
				success: false,
				message: 'This SOS alert is no longer active'
			});
		}
		
		const notifiedEntry = sos.notifiedPumps.find(
			(n) => n.pump.toString() === pump._id.toString()
		);
		
		if(notifiedEntry) {
			notifiedEntry.responded = true;
			notifiedEntry.resonse = reponse;
		}
		
		const io = req.app.get('io');
		
		if(response === 'accepted') {
			sos.status = 'responded';
			sos.respondingPump = pump._id;
			
			const fuelEntry = pump.fuelStock.find(
				(f) => f.fuelType === sos.fuelType && f.isAvailable
			);
			
			if(fuelEntry) {
				const totalAmount = fuelEntry.pricePerLitre * sos.quantityNeeded + (pump.deliveryCharge || 0);
				
				const order = await Order.create({
					seeker: sos.seeker._id,
					pump: pump._id,
					fuelType: sos.fuelType,
					quantityLitres: sos.quantityNeeded,
					pricePerLitre: fuelEntry.pricePerLitre,
					deliveryCharge: pump.deliveryCharge || 0,
					totalAmount,
					deliveryLocation: sos.location,
					deliveryAddress: sos.locationDescription || 'SOS location (see GPS)',
					paymentMethod: 'cash',
					status: 'accepted',
					timeline: { placedAt: new Date(), acceptedAt: new Date() },
				});
				
				sos.convertedToOrder = order._id;
				await order.populate('pump', 'name address');
				
				io.to(sos.seeker._id.toString()).emit('sos: accepted', {
					sosId: sos._id,
					pump: { _id: pump._id, name: pump.name, phone: pump.owner },
					order,
				});
			}
			
			sos.notifiedPumps.forEach((n) => {
				if(n.pump.toString() !== pump._id.toString()) {
					io.to(n.pump.toString()).emit('sos:resolved', { sosId: sos._id });
				}
			});
		} else {
			const allDeclined = sos.notifiedPumps.every(
				(n) => n.responded && n.responded === 'declined'
			);
			if(allDeclined) {
				sos.status = 'expired';
				io.to(sos.seeker._id.toString()).emit('sos:noResponse', { sosId: sos._id });
			}
		}
		
		await sos.save();
		res.status(200).json({
			success: true,
			sos
		});
	} catch (error) {
		console.error('respondToSos error: ', error);
		res.status(500).json({
			success: false,
			message: 'Failed to respond to SOS'
		});
	}
}

exports.cancelSos = async (req, res) => {
	try {
		const sos = await Sosalert.findById(req.params.id);
		if(!sos) return res.status(404).json({
			success: false,
			message: 'SOS not found'
		});
		if(sos.seeker.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: 'Not authorised'
			});
		}
		sos.status = 'cancelled';
		await sos.save();
		
		const io = req.app.get('io');
		sos.notifiedPumps.forEach((n) => {
			io.to(n.pump.toString()).emit('sos:cancelled', { sosId: sos._id });
		});
		
		res.status(200).json({
			success: true,
			sos
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to cancel SOS'
		});
	}
}