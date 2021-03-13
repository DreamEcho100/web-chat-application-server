const jwt = require('jsonwebtoken');
const config = require('../config/app');

exports.auth = (request, response, next) => {
	const authHeader = request.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		response.status(401).json({ error: 'Missing token!' });
	}

	jwt.verify(token, config.appKey, (error, user) => {
		if (error) {
			response.status(401).json({ error });
		}

		request.user = user;
	});

	next();
};
