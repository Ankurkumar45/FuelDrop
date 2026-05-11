const express = require('express');
const router = express.Router();

const { placeOrder, getMyOrders, getPumpOrders, getAgentOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

//Seeker
router.post('/', authorize('seeker'), placeOrder);
router.get('/my-orders', authorize('seeker'), getMyOrders);

router.get('/pump-orders', authorize('pump_owner'), getPumpOrders);
router.get('/agent-orders', authorize('delivery_agent'), getAgentOrders);
router.put('/:id/status', authorize('pump_owner', 'delivery_agent'), updateOrderStatus);
router.put('/:id/cancel', authorize('seeker'), cancelOrder);

module.exports = router