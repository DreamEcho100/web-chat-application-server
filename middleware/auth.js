const jwt = require('jsonwebtoken');
const config = require('../config/app');

exports.auth = (request, response, next) => {
	const authHeader = request.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return response.status(401).json({ error: 'Missing token!' });
	}

	jwt.verify(token, config.appKey, (error, user) => {
		if (error) {
			return response.status(401).json({ error });
		}
		console.log(user);
		request.user = user;
	});

	next();
};
