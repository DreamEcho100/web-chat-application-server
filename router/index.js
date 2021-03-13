const router = require('express').Router();

router.get('/home', (request, response) => {
	response.send('Hello World! Home Screen');
});

router.use('/', require('./auth'));

router.use('/users', require('./user'));

module.exports = router;
