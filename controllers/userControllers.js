const User = require('../models').User;
const sequelize = require('sequelize');

exports.update = async (request, response) => {
	try {
		if (request.file) {
			request.body.avatar = request.file.filename;
		}

		if (
			typeof request.body.avatar !== 'undefined' &&
			request.body.avatar.length === 0
		) {
			delete request.body.avatar;
		}

		const [rows, result] = await User.update(request.body, {
			where: {
				id: request.user.id,
			},
			returnIng: true,
			individualHooks: true,
		});

		const user = result[0].get({ raw: true });
		user.avatar = result[0].avatar;
		delete user.password;

		response.json(user);
	} catch (error) {
		return response.status(500).json({ error: error.message });
	}
	// return response.send('User controller.');
};
