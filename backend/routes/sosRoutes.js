const express = require('express');
const router = express.Router();

const { createSos, getMySos, getIncomingSos, respondToSos, cancelSos } = require('../controllers/sosController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('seeker'), createSos);
router.get('/my-sos', authorize('seeker'), getMySos);
router.get('/:id/cancel', authorize('seeker'), cancelSos);

router.get('/incoming', authorize('pump_owner'), getIncomingSos);
router.put('/:id/respond', authorize('pump_owner'), respondToSos);

module.exports = router;