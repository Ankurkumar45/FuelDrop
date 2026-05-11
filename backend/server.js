const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoute = require('./routes/authRoutes');
const pumpRoute = require('./routes/pumpRoutes');
const orderRoute = require('./routes/orderRoutes');
const sosRoute = require('./routes/sosRoutes');
const paymentRoute = require('./routes/paymentRoutes');

dotenv.config();
connectDB();


const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	'http://localhost:5173',
	'http://localhost:5174',
	...(process.env.CLIENT_URL
		? process.env.CLIENT_URL.split(',').map((o) => o.trim())
		: []),
];

const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (Postman, mobile apps, curl)
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		console.warn(`CORS blocked: ${origin}`);
		callback(new Error(`CORS blocked: ${origin} is not allowed`));
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
	cors: corsOptions,
});

app.set('io', io);

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);
app.use('/api/pumps', pumpRoute);
app.use('/api/orders', orderRoute);
app.use('/api/sos', sosRoute);
app.use('/api/payments', paymentRoute);

// Health check endpoint
app.get('/api/health', (req, res) => {
	res.json({
		success: true,
		message: 'FuelDrop API is running',
		timestamp: new Date().toISOString(),
		allowedOrigins,
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.originalUrl} not found`
	});
});

//Global error handler
app.use((err, req, res, next) => {
	console.error('Undandled error: ', err);

	// Mongoose duplicate key error
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		return res.status(400).json({
			success: false,
			message: `${field} already exists`
		});
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map((e) => e.message);
		return res.status(400).json({
			success: false,
			message: message.join(', ')
		});
	}

	res.status(err.statusCode || 500).json({
		success: false,
		message: err.message || 'Internal server error'
	});
});

//Socket.IO connection handler
io.on('connection', (socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on('join', (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room`);
	});

	socket.on('disconnect', () => {
		console.log(`Socket disconnected: ${socket.id}`);
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`FuelDrop server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
	console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
});