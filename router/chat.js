const router = require('express').Router();
const { chatFile } = require('../middleware/fileUpload');
const {
	index,
	create,
	messages,
	deleteChat,
	imageUpload,
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { validate } = require('../validators');

router.get('/', [auth], index);
router.post('/create', [auth], create);
router.post('/upload-image', [auth, chatFile], imageUpload);
router.get('/messages', [auth], messages);
router.delete('/:id', [auth], deleteChat);

module.exports = router;
