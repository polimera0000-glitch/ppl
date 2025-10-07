const express = require('express');
const contactController = require('../controllers/contactController');
const {authenticate} = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, contactController.create);
router.get('/', authenticate, contactController.list);
router.patch('/:id', authenticate, contactController.updateStatus);

module.exports = router;
