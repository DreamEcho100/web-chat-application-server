require('dotenv').config();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models').User;
const config = require('../config/app');

const generateToken = (user) => {
	delete user.password;

	const token = jwt.sign(user, config.appKey, { expiresIn: 86480 });

	return { ...user, ...{ token } };
};

exports.login = async (request, response) => {
	try {
		// console.log(require('crypto').randomBytes(64).toString('hex'));
		// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZmlyc3ROYW1lIjoiSm9obiIsImxhc3ROYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBnbWFpbC5jb20iLCJnZW5kZXIiOiJtYWxlIiwiYXZhdGFyIjpudWxsLCJjcmVhdGVkQXQiOiIyMDIxLTAzLTA4VDA5OjI5OjM3LjIzMVoiLCJ1cGRhdGVkQXQiOiIyMDIxLTAzLTA4VDA5OjI5OjM3LjIzMVoiLCJpYXQiOjE2MTUyMDYyNDcsImV4cCI6MTYxNTI5MjcyN30.Xed3wJCSUULY_BNOQOoQxp9BMQFsP4W7i-imVl0S-3k
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
		//
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
		// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZmlyc3ROYW1lIjoiTGVubnkiLCJsYXN0TmFtZSI6IkRvZSIsImVtYWlsIjoibGVubnkuZG9lQGdtYWlsLmNvbSIsImdlbmRlciI6Im1hbGUiLCJ1cGRhdGVkQXQiOiIyMDIxLTAzLTA4VDEyOjM3OjM0LjA4OFoiLCJjcmVhdGVkQXQiOiIyMDIxLTAzLTA4VDEyOjM3OjM0LjA4OFoiLCJhdmF0YXIiOm51bGwsImlhdCI6MTYxNTIwNzA1NCwiZXhwIjoxNjE1MjkzNTM0fQ.4HesQHnAcQDieKi5IBMo2G9xeY4O_gM8P7mzZhx_N2Y
		/*
{
    "firstName": "Lenny",
    "lastName": "Doe",
    "email": "lenny.doe@gmail.com",
    "password": "secret4",
    "gender": "male"
}
    */
		// generate auth
		const userWithToken = generateToken(user.get({ raw: true }));
		return response.status(200).json(userWithToken);
	} catch (error) {
		console.error(error);
		return response.status(500).json({ message: error.message });
	}
};
