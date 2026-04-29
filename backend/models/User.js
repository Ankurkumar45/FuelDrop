const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			maxlength: [50, 'Name cannot exceed 50 characters'],
		},
		
		email: {
			type: String,
			requierd: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email!'],
		},
		
		phone: {
			type: String,
			required: [true, 'Phone is required'],
			unique: true,
			match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number!'],
		},
		
		password: {
			type: String,
			required: [true, 'Password is requiredd'],
			minlength: [6, 'Password must be at least 6 characters!'],
			select: false
		},
		
		role: {
			type: String,
			enum: ['seeker', 'pump_owner', 'delivery_agent'],
			default: 'seeker',
		},
		
		profileImage: {
			type: String,
			default: '',
		},
		
		currentLocation: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
			},
			coordinates: {
				type: [Number],
				default: [0, 0],
			},
		},
		
		isAvailable: {
			type: Boolean,
			default: false,
		},
		
		isActive: {
			type: Boolean,
			default: true,
		},
		
		resetPasswordToken: String,
		resetPasswordExpire: Date,
	},
	
	{
		timestamps: true,
	},
);

userSchema.index({
	currentLocation: '2dsphere'
});

userSchema.pre('save', async function(next) {
	if(!this.isModified('password')) return next();
	
	const salt = await bcrypt.genSalt(12);
	this.password = await bcrypt.hash(this.password, salt);
	
	next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);