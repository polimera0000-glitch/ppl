const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const couponController = require('../controllers/couponController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User route - validate coupon
router.get('/validate/:code', couponController.validateCoupon);

// Admin routes - manage coupons
router.use(requireAdmin);
router.post('/', couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
