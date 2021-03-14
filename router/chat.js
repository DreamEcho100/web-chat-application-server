const router = require('express').Router();
const {
	index,
	create,
	messages,
	deleteChat,
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { validate } = require('../validators');

router.get('/', [auth], index);
router.post('/create', [auth], create);
router.get('/messages', [auth], messages);
router.delete('/:id', [auth], deleteChat);

module.exports = router;
