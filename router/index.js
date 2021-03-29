const router = require('express').Router();

router.get('/home', (request, response) => {
	return response.send('Hello World! Home Screen');
});

router.use('/', require('./auth'));

router.use('/users', require('./user'));
router.use('/chats', require('./chat'));

module.exports = router;
