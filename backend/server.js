const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const cors = require('cors');

const authRoute = require('./routes/authRoutes');

dotenv.config();

connectDB()

const app = express();
const server = http.createServer(app);

app.use(cors({
	origin: process.env.CLIENT_URL,
	credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoute);

app.get('/api/health', (req, res) => {
	res.json({
		success: true,
		message: 'FuelDrop API is running',
		timestamp: new Date().toISOString(),
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