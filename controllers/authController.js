require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models').User;
const config = require('../config/app');

const generateToken = (user) => {
	delete user.password;

	const token = jwt.sign(user, config.appKey, { expiresIn: 86480 });

	return { ...{ user }, ...{ token } };
};

exports.login = async (request, response) => {
	try {
		const { email, password } = request.body;
		// Find the user
		const user = await User.findOne({
			where: { email },
		});
		// Check if user found
		if (!user) {
			return response.status(404).json({ message: 'User not found!' });
		}

		// Check if password matches
		if (!bcrypt.compareSync(password, user.password)) {
			return response.status(404).json({ message: 'Incorrect password!' });
		}

		// generate auth
		const userWithToken = generateToken(user.get({ raw: true }));
		userWithToken.user.avatar = user.avatar;
		return response.status(200).json(userWithToken);
	} catch (error) {
		console.error(error);
		return response.status(500).json({ message: error.message });
	}
};

exports.register = async (request, response) => {
	try {
		const { firstName, lastName, email, password, gender } = request.body;
		const user = await User.create({
			firstName,
			lastName,
			email,
			password,
			gender,
		});

		// generate auth
		const userWithToken = generateToken(user.get({ raw: true }));
		userWithToken.user.avatar = user.avatar;
		return response.status(200).json(userWithToken);
	} catch (error) {
		console.error(error);
		return response.status(500).json({ message: error.message });
	}
};
