const express = require('express');
const router = express.Router();

const { placeOrder, getMyOrders, getPumpOrders } = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

//Seeker
router.post('/', authorize('seeker'), placeOrder);
router.get('/my-orders', authorize('seeker'), getMyOrders);

router.get('/pump-orders', authorize('pump_owner'), getPumpOrders);

module.exports = router