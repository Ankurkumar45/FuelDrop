const express = require('express');

const router = express.Router();

const { createPump, getNearbyPumps, getMyPump, getPumpById, updatePump, updateStock } = require('../controllers/pumpController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/nearby', getNearbyPumps);

router.get('/my-pump', authorize('pump_owner'), getMyPump);
router.post('/', authorize('pump_owner'), createPump);
router.put('/:id', authorize('pump_owner'), updatePump);
router.put('/:id/stock', authorize('pump_owner'), updateStock);

router.get('/:id', getPumpById);

module.exports = router;