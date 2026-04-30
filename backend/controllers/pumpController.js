const Pump = require('../models/Pump');

exports.createPump = async (req, res) => {
	try {
		const existing = await Pump.findOne({ owner: req.user.id });
		
		if(existing) {
			return res.status(400).json({
				success: false,
				message: 'You already have a registered pump. Update it instead.'
			});
		}
		
		const pump = await Pump.create({
			...req.body,
			owner: req.user.id
		});
		
		res.status(201).json({
			success: true,
			pump,
		});
	} catch(error) {
		console.error('createPump error: ', error);
		res.status(500).json({
			success: false,
			message: error.message || 'Failed to create pump!'
		});
	}
}

exports.getNearbyPumps = async (req, res) => {
	try {
		const { lng, lat, radius = 10, fuelType } = req.query;
		
		if(!lng || !lat) {
			return res.status(400).json({
				success: false,
				message: 'longitude (lng) and latitude (lat) are required'
			});
		}
		
		const radiusInMetres = parseFloat(radius) * 1000;
		
		const query = {
			isActive: true,
			isVerified: true,
			location: {
				$near: {
					$geometry: {
						type: 'Point',
						coordinates: [parseFloat(lng), parseFloat(lat)],
					},
					$maxDistance: radiusInMetres,
				},
			},
		};
		
		if(fuelType) {
			query['fuelStock'] = {
				$elemMatch: {
					fuelType,
					isAvailable: true,
					availableLitres: { $gt: 0 },
				},
			};
		}
		
		const pumps = await Pump.find(query)
						.populate('owner', 'name phone')
						.limit(20);
		
		const pumpWithDistance = pumps.map((pump) => {
			const pumpObj = pump.toObject({ virtuals: true });
			pumpObj.distanceMetres = getDistanceMetres(
				parseFloat(lat), parseFloat(lng),
				pump.location.coordinates[1], pump.location.coordinates[0]
			);
			return pumpObj;
		});
		
		res.status(200).json({
			success: true,
			count: pumps.length,
			pumps: pumpWithDistance,
		});
	} catch(error) {
		console.error('getNearbyPumps error: ', error);
		res.status(500).json({
			success: false,
			message: 'Failed to fetch nearby pumps'
		});
	}
}

exports.getMyPump = async (req, res) => {
	try {
		const pump = await Pump.findOne({ owner: req.user.id }).populate('owner', 'name phone email');
		
		if(!pump) {
			return res.status(404).json({
				success: false,
				message: 'No pump found. Please register your pump first'
			});
		}
		
		res.status(200).json({
			success: true,
			pump
		});
	} catch(error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch pump!'
		});
	}
}

exports.getPumpById = async (req, res) => {
	try {
		const pump = await Pump.findById(req.params.id).populate('owner', 'name, phone');
		
		if(!pump) {
			return res.status(404).json({
				success: false,
				message: 'Pump not found!'
			});
		}
		
		res.status(200).json({
			success: true,
			pump
		});
	} catch(error) {
		res.status(500).json({
			success: false,
			message: 'Failed to fetch pump!'
		});
	}
}

exports.updatePump = async (req, res) => {
	try {
		let pump = await Pump.findById(req.params.id);
		
		if(!pump) return res.status(404).json({
			success: false,
			message: 'Pump not found!'
		});
		
		if(pump.owner.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: 'Not authorised to update this pump'
			});
		}
		
		pump = await Pump.findByIdAndUpdate(req.params.id, req.body, {
			returnDocument: 'after',
			runValidators: true,
		});
		
		res.status(200).json({
			success: true,
			pump
		});
	} catch(error) {
		console.error('Update pump error: ', error);
		
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
}

exports.updateStock = async (req, res) => {
	try {
		const pump = await Pump.findById(req.params.id);
		
		if(!pump) return res.status(404).json({
			success: false,
			message: 'Pump not found'
		});
		
		if(pump.owner.toString() !== req.user.id) {
			return res.status(403).json({
				success: false,
				message: 'Not authorised'
			});
		}
		
		pump.fuelStock = req.body.fuelStock;
		await pump.save();
		
		const io = req.app.get('io');
		io.emit('pump:stockUpdated', {
			pumpId: pump._id,
			fuelStock: pump.fuelStock
		});
		
		res.status(200).json({
			success: true,
			pump
		});
	} catch(error) {
		console.error("UPDATE STOCK ERROR:", error);
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
}

function getDistanceMetres(lat1, lng1, lat2, lng2) {
	const R = 6371000;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	
	const a = Math.sin(dLat / 2) ** 2 +
			  Math.cos((lat1 * Math.PI) / 180) *
			  Math.cos((lat2 * Math.PI) / 180) *
			  Math.sin(dLng / 2) ** 2;
	
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

