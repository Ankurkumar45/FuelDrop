const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoute = require('./routes/authRoutes');
const pumpRoute = require('./routes/pumpRoutes');
const orderRoute = require('./routes/orderRoutes');

dotenv.config();
connectDB()


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: process.env.CLIENT_URL || 'http://localhost:5173',
		methods: ['GET', 'POST'],
	},
});

app.set('io', io);

app.use(cors({
	origin: process.env.CLIENT_URL || 'http://localhost:5173',
	credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);
app.use('/api/pumps', pumpRoute);
app.use('/api/orders', orderRoute);

//404 handler
app.get('/api/health', (req, res) => {
	res.json({
		success: true,
		message: 'FuelDrop API is running',
		timestamp: new Date().toISOString(),
	});
});

//Global error handler
app.use((err, req, res, next) => {
	console.error('Undandled error: ', error);
	
	// Mongoose duplicate key error
	if(err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		return res.status(400).json({
			success: false,
			message: `${field} already exists`
		});
	}
	
	// Mongoose validation error
	if(err.name === 'ValidationError') {
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

app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.originalUrl} not found`
	});
});

//Socket.IO connection handler
io.on('connection', (socket) => {
	console.log(`Socket connected: ${socket.id}`);
	
	socket.on('join', (userId) => {
		socket.join(userId);
		console.lo(`User ${userId} joined room`);
	});
	
	socket.on('disconnect', () => {
		console.log(`Socket disconnected: ${socket.id}`);
	});
});

app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.originalUrl} not found`,
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`FuelDrop server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});