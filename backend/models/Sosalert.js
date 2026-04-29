const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema(
	{
		seeker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		
		location: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
			},
			coordinates: {
				type: [Number],
				required: true,
			},
		},
		
		locationDescription: {
			type: String,
			maxlength: 200,
		},
		
		fuelType: {
			type: String,
			enum: ['petrol', 'diesel', 'cng'],
			required: true,
		},
		
		quantityNeeded: {
			type: Number,
			default: 2,
			min: 1
		},
		
		notifiedPumps: [
			{
				pump: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Pump',
				},
				notifiedAt: {
					type: Date,
					default: Date.now,
				},
				responded: {
					type: Boolean,
					default: false,
				},
				response: {
					type: String,
					enum: ['accepted', 'declined'],
					default: null,
				},
			},
		],
		
		respondingPump: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Pump',
			default: null,
		},
		
		convertedToOrder: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order',
			default: null,
		},
		
		status: {
			type: String,
			enum: ['active', 'responded', 'resolved', 'expired', 'cancelled'],
			default: 'active',
		},
		
		expiresAt: {
			type: Date,
			default: () => new Date(
				Date.now() + 30 * 60* 1000
			),
		},
		
		broadcastRadiusMetres: {
			type: Number,
			default: 10000,
		},
	},
	{
		timestamps: true,
	}
);

sosAlertSchema.index({
	location: '2dsphere'
});

sosAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('SosAlertSchema', sosAlertSchema);