const { body } = require('express-validator');

exports.rules = (() => {
	return [
		body('firstName').notEmpty(),
		body('lastName').notEmpty(),
		body('email').isEmail(),
		body('password').isLength({ min: 5 }),
		body('gender').notEmpty(),
	];
})();
