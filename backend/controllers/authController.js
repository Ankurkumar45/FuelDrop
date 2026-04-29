const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
	return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE_IN || '7d',
	});
};

const sendTokenResponse = (user, statusCode, res) => {
	const token = generateToken(user._id);
	
	user.password = undefined;
	
	res.status(statusCode).json({
		success: true,
		token,
		user,
	});
};

exports.register = async (req, res) => {
	try {
		const { name, email, phone, password, role } = req.body;
		
		if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }
		
		const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
		
		if(existingUser) {
			const field = existingUser.email == email ? 'Email' : 'Phone number';
			return res.status(400).json({
				success: false,
				message: `${field} is already registered`,
			});
		}
		
		const allowedRoles = ['seeker', 'pump_owner', 'delivery_agent'];
		const userRole = allowedRoles.includes(role) ? role : 'seeker';
		
		const user = await User.create({ name, email, phone, password, role: userRole });
		
		sendTokenResponse(user, 201, res);
		
	} catch(error) {
		console.log('Register error: ', error);
		res.status(500).json({
			success: false,
			message: 'Server error during registration'
		});
	}
}

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		
		if(!email || !password) {
			return res.status(400).json({
                success: false,
                message: "Please provide email and password",
            });
		}
		
		const user = await User.findOne({ email }).select('+password');
		
		if(!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials!'
			});
		}
		
		if(!user.isActive) {
			return res.status(403).json({
				success: false,
				message: 'Account has been suspended. Contact support.'
			});
		}
		
		const isMatch = await user.matchPassword(password);
		
		if(!isMatch) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}
		sendTokenResponse(user, 200, res);
	} catch(error) {
		console.error('Login error: ', error);
		res.status(500).json({
			success: false,
			message: 'Server error during login',
		});
	}
}

exports.getMe = async (req, res) => {
	try {
		//const user = await User.findById(req.user.id);
		res.status(200).json({
			success: true,
			user: req.user
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Server error'
		});
	}
}

exports.updateProfile = async (req, res) => {
	try {
		const allowedFields = ['name', 'phone', 'profileImage'];
		const updates = {};
		
		allowedFields.forEach((field) => {
			if(req.body[field] !== undefined) updates[field] = req.body[field];
		});
		
		if(Object.keys(updates).length == 0) {
			return res.status(400).json({
				success: false,
				message: 'No valid fields to update'
			});
		}
		
		//console.log(updates);
		
		const user = await User.findByIdAndUpdate(req.user.id, updates, {
			returnDocument: 'after',
			runValidators: true,
		});
		
		if(!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found!'
			});
		}
		
		//console.log(user);
		
		res.status(200).json({
			success: true,
			user
		});
	} catch(error) {
		res.status(500).json({
			success: false,
			message: 'Failed to update profile'
		});
	}
}

exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		
		if(!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "Both current and new password are required!"
			});
		}
		
		const user = await User.findById(req.user.id).select('+password');
		
		const isMatch = await user.matchPassword(currentPassword);
		
		if(!isMatch) {
			return res.status(401).json({
				success: false,
				message: 'Current password is incorrect'
			});
		}
		
		user.password = newPassword;
		await user.save();
		
		sendTokenResponse(user, 200, res);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'Failed to change password'
		});
	}
}

exports.updateLocation = async (req, res) => {
	try {
		const { longitude, latitude } = req.body;
		
		if(req.user.role !== 'delivery_agent') {
			return res.status(403).json({
				success: false,
				message: 'Only delivery agents can update location'
			});
		}
		
		const user = await User.findByIdAndUpdate(req.user.id, {
				currentLocation: {
					type: 'Point',
					coordinates: [parseFloat(longitude), parseFloat(latitude)],
				},
			},
			{ new: true }
		);
		
		res.status(200).json({
			success: true,
			user
		});
	} catch(error) {
		res.status(500).json({
			success: false,
			message: 'Failed to update location'
		});
	}
}