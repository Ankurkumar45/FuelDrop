const mongoose = require('mongoose');

const pumpSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Pump name is required'],
			trim: true,
		},
		
		owner: {
			type: mongoose.Schema.Type.ObjectId,
			ref: 'User',
			required: true,
		},
		
		location: {
			type: {
				type: String,
				enum: ['Point'],
				required: true,
				default: 'Point',
			},
			coordinates: {
				type: [Number],
				required: true,
			},
		},
		
		address: {
			street: {
				type: String,
				required: true,
			},
			city: {
				type: String,
				required: true,
			},
			state: {
				type: String,
				required: true,
			},
			pincode: {
				type: String,
				required: true,
			},
		},
		
		fuelStock: [
			{
				fueltype: {
					type: String,
					enum: ['petrol', 'diesel', 'cng'],
					required: true,
				}
				pricePerLitre: {
					type: Number,
					required: true,
					min: [0, 'Price cannot be negative'],
				},
				availableLitres: {
					type: Number,
					default: 0,
					min: [0, 'Stock cannot be negative'],
				},
				isAvailable: {
					type: Boolean,
					default: true,
				},
			},
		],
		
		offersDelivery: {
			type: Boolean,
			default: false,
		},
		
		deliveryRadiusKm: {
			type: Number,
			default: 5,
			min: 1,
			max: 50,
		},
		
		minimumDeliveryLitres: {
			type: Number,
			default: 2,
		},
		
		deliveryCharge: {
			type: Number,
			default: 0,
		},
		
		openTime: {
			type: String,
			default: '06:00',
		},
		
		closeTime: {
			type: String,
			default: '22:00',
		},
		
		open24Hours: {
			type: Boolean,
			default: false,
		},
		
		image: [String],
		
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		
		totalRatings: {
			type: Number,
			default: 0,
		},
		
		isVarified: {
			type: Boolean,
			default: false,
		},
		
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	
	{
		timestamp: true,
	}
);

pumpSchema.index({
	location: '2dsphere'
});

pumpSchema.virtual('isOpenNow').get(function() {
	if(this.open24Hours) return true;
	
	const now = new Date();
	const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	
	return currentTime >= this.openTime && currentTime <= this.closeTime;
});

module.exports = mongoose.model('Pump', pumpSchema);