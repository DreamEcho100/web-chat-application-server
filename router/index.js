const router = require('express').Router();

router.get('/home', (request, response) => {
	response.send('Hello World! Home Screen');
});

router.use('/', require('./auth'));

module.exports = router;
