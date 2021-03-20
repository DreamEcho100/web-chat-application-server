// require('dotenv').config()
const socketIo = require('socket.io');

const { sequelize } = require('../models');

const users = new Map();
const userSockets = new Map();

const SocketServer = (server) => {
	const io = socketIo(server, {
		cors: {
			origin: '*', // `${process.env.APP_URL}:${process.env.APP_PORT}`,
			methods: ['GET', 'HEAD', 'PATCH', 'POST', 'DELETE', 'PUT'],
			preflightContinue: false,
			optionsSuccesss: 204,
		},
	});

	io.on('connection', (socket) => {
		socket.on('join', async (user) => {
			let sockets = [];
			// console.log(`New user joined: ${user.firstName} ${user.lastName}`);

			if (users.has(user.id)) {
				const existingUser = users.get(user.id);
				existingUser.sockets = [...existingUser.sockets, ...[socket.id]];
				users.set(user.id, existingUser);
				sockets = [...existingUser.sockets, ...[socket.id]];
				userSockets.set(socket.id, user.id);
			} else {
				users.set(user.id, { id: user.id, sockets: [socket.id] });
				sockets.push(socket.id);
				userSockets.set(socket.id, user.id);
			}

			const onlineFriends = [];

			const chatters = await getChatters(user.id);

			// console.log(chatters);

			// notify his friends that user is now online
			for (let i = 0; i < chatters.length; i++) {
				if (users.has(chatters[i])) {
					const chatter = users.get(chatters[i]);
					chatter.sockets.forEach((socket) => {
						try {
							io.to(socket).emit('online', user);
						} catch (error) {
							console.error(error);
						}
					});
					onlineFriends.push(chatter.id);
				}
			}

			// send to user sockets which of his friends are online
			sockets.forEach((socket) => {
				try {
					io.to(socket).emit('friends', onlineFriends);
				} catch (error) {
					console.error(error);
				}
			});

			io.to(socket.id).emit('typing', 'Using typing...');
		});

		socket.on('disconnect', async () => {
			if (userSockets.has(socket.id)) {
				const user = users.get(userSockets.get(socket.id));

				if (user.sockets.length > 1) {
					user.sockets = user.socket.filter((sock) => {
						if (sock !== socket.id) return true;

						userSockets.delete(sock);
						return false;
					});

					users.set(user.id, user);
				} else {
					const chatters = await getChatters(user.id);

					for (let i = 0; i < chatters.length; i++) {
						if (users.has(chatters[i])) {
							users.get(chatters[i]).sockets.forEach((socket) => {
								try {
									io.to(socket).emit('offline', user);
								} catch (e) {
									console.error(e);
									return [];
								}
							});
						}
					}

					userSockets.delete(socket.id);
					users.delete(user.id);
				}
			}
		});
	});
};

const getChatters = async (userId) => {
	try {
		const [results, metadata] = await sequelize.query(`
        select "cu"."userId" from "ChatUsers" as cu
        inner join (
            select "c"."id" from "Chats" as c
            where exists (
                select "u"."id" from "Users" as u
                inner join "ChatUsers" on u.id = "ChatUsers"."userId"
                where u.id = ${parseInt(userId)} and c.id = "ChatUsers"."chatId"
            )
        ) as cjoin on cjoin.id = "cu"."chatId"
        where "cu"."userId" != ${parseInt(userId)}
    `);

		return results.length > 0 ? results.map((el) => el.userId) : [];
	} catch (e) {
		console.error(e);
		return [];
	}
};

module.exports = SocketServer;
