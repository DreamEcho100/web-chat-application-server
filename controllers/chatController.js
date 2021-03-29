const models = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const User = models.User;
const Chat = models.Chat;
const ChatUser = models.ChatUser;
const Message = models.Message;

exports.index = async (request, response) => {
	if (!request.user && !request.user.id) {
		return response.status(404).json({ error: 'No id provided' });
	}
	const user = await User.findOne({
		where: {
			id: request.user.id,
		},
		include: [
			{
				model: Chat,
				include: [
					{
						model: User,
						where: {
							[Op.not]: {
								id: request.user.id,
							},
						},
					},
					{
						model: Message,
						include: [
							{
								model: User,
							},
						],
						limit: 20,
						order: [['id', 'DESC']],
					},
				],
			},
		],
	});

	return response.json(user.Chats);
};

exports.create = async (request, response) => {
	const { partnerId } = request.body;

	const transac = await sequelize.transaction();

	try {
		const user = await User.findOne({
			where: {
				id: request.user.id,
			},
			include: [
				{
					model: Chat,
					where: {
						type: 'dual',
					},
					include: [
						{
							model: ChatUser,
							where: {
								userId: partnerId,
							},
						},
					],
				},
			],
		});

		if (user && user.Chats.length > 0) {
			// console.log(user, user.Chats);
			return response.status(403).json({
				status: 'Error',
				message: 'Chat with this user already exists!',
			});
		}

		const chat = await Chat.create({ type: 'dual', transaction: transac });

		await ChatUser.bulkCreate(
			[
				{
					chatId: chat.id,
					userId: request.user.id,
				},
				{
					chatId: chat.id,
					userId: partnerId,
				},
			],
			{ transaction: transac }
		);

		await transac.commit();

		// const chatNew = await Chat.findOne({
		// 	where: {
		// 		id: chat.id,
		// 	},
		// 	include: [
		// 		{
		// 			model: User,
		// 			where: {
		// 				[Op.not]: {
		// 					id: request.user.id,
		// 				},
		// 			},
		// 		},
		// 		{
		// 			model: Message,
		// 		},
		// 	],
		// });

		// return response.json(chatNew);

		const creator = await User.findOne({
			where: {
				id: request.user.id,
			},
		});

		const partner = await User.findOne({
			where: {
				id: partnerId,
			},
		});

		const forCreator = {
			id: chat.id,
			type: 'dual',
			Users: [partner],
			Messages: [],
		};

		const forReceiver = {
			id: chat.id,
			type: 'dual',
			Users: [creator],
			Messages: [],
		};

		return response.json([forCreator, forReceiver]);
	} catch (error) {
		await transac.rollback();
		return response
			.status(500)
			.json({ status: 'Error', message: error.message });
	}
};

exports.messages = async (request, response) => {
	const limit = 10;
	const page = request.query.page || 1;
	const offset = page > 1 ? page * limit : 0;

	const messages = await Message.findAndCountAll({
		where: {
			chatId: request.query.id,
		},
		include: [
			{
				model: User,
			},
		],
		limit,
		offset,
		order: [['id', 'DESC']],
	});

	const totalPages = Math.ceil(messages.count / limit);

	if (page > totalPages) {
		return response.json({ data: { messages: [] } });
	}

	const result = {
		messages: messages.rows,
		pagination: {
			page,
			totalPages,
		},
	};

	return response.json(result);
};

exports.imageUpload = async (request, response) => {
	if (request.file) {
		return response.json({ url: request.file.filename });
	}

	return response.status(500).json('No image uploaded!');
};

exports.addUserToGroup = async (request, response) => {
	try {
		const { chatId, userId } = request.body;

		const chat = await Chat.findOne({
			where: {
				id: chatId,
			},
			include: [
				{
					model: User,
				},
				{
					model: Message,
					include: [
						{
							model: User,
						},
					],
					limit: 20,
					order: [['id', 'DESC']],
				},
			],
		});

		chat.Messages.reverse();

		// Check if already in group
		chat.Users.forEach((user) => {
			if (user.id === userId) {
				return response
					.status(403)
					.json({ message: 'User already in the group!' });
			}
		});

		await ChatUser.create({ chatId, userId });

		const newChatter = await User.findOne({
			where: {
				id: userId,
			},
		});

		if (chat.type === 'dual') {
			chat.type = 'group';
			chat.save();
		}

		return response.json({ chat, newChatter });
	} catch (error) {
		return res.status(500).json({ status: 'Error', message: error.message });
	}
};

exports.deleteChat = async (request, response) => {
	try {
		const { id } = request.params;
		const chat = await Chat.findOne({
			where: {
				id,
			},
			include: [
				{
					model: User,
				},
			],
		});
		const notifyUser = chat.Users.map((user) => user.id);

		await chat.destroy();
		return response.json({ chatId: id, notifyUser });
	} catch (error) {
		return response
			.status(500)
			.json({ status: 'Error', message: error.message });
	}
};
