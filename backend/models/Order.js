const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
	{
		seeker: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		
		pump: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Pump',
			required: true,
		},
		
		deliveryAgent: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null,
		},
		
		fuelType: {
			type: String,
			enum: ['petrol', 'diesel', 'cng'],
			required: true,
		},
		
		quantityLitres: {
			type: Number,
			required: true,
			min: [1, 'Minimum order is 1 littre'],
		},
		
		pricePerLitre: {
			type: Number,
			required: true,
		},
		
		deliveryCharge: {
			type: Number,
			default: 0,
		},
		
		totalAmount: {
			type: Number,
			required: true,
		},
		
		deliveryLocation: {
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
		
		deliveryAddress: {
			type: String,
			required: true,
		},
		
		status: {
			type: String,
			enum: ['pending', 'accepted', 'assigned', 'en_route', 'delivered', 'cancelled', 'rejected'],
			default: 'pending',
		},
		
		timeline: {
			placedAt: {
				type: Date,
				default: Date.now,
			},
			acceptedAt: { type: Date },
			assignedAt: { type: Date },
			enRouteAt: { type: Date },
			deliveredAt: { type: Date },
			cancelledAt: { type: Date },
		},
		
		paymentMethod: {
			type: String,
			enum: ['cash', 'online'],
			default: 'cash',
		},
		
		paymentStatus: {
			type: String,
			enum: ['pending', 'paid', 'refunded'],
			default: 'pending',
		},
		
		razorpayOrderId: { type: String },
		razorpayPaymentId: { type: String },
		
		review: {
			rating: {
				type: Number,
				min: 1,
				max: 5,
			},
			
			comment: {
				type: String,
				maxlength: 300,
			},
		},
		
		cancellationReason: { type: String },
		
		specialInstructions: { type: String, maxlength: 200 },
	},
	
	{
		timestamps: true,
	}
);

orderSchema.index({
	deliveryLocation: '2dsphere'
});

orderSchema.index({
	seeker: 1,
	status: 1
});

orderSchema.index({
	pump: 1,
	status: 1
});

module.exports = mongoose.module('Order', orderSchema);