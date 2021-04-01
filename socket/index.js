// require('dotenv').config()
const socketIo = require('socket.io');

const { sequelize } = require('../models');
const Message = require('../models').Message;

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
							// console.error(error);
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
					// console.error(error);
				}
			});

			io.to(socket.id).emit('typing', 'Using typing...');
		});

		socket.on('message', async (message) => {
			let sockets = [];

			if (users.has(message.fromUser.id)) {
				sockets = users.get(message.fromUser.id).sockets;
			}

			message.toUserId.forEach((id) => {
				if (users.has(id)) {
					sockets = [...sockets, ...users.get(id).sockets];
				}
			});

			try {
				const msg = {
					type: message.type,
					fromUserId: message.fromUser.id,
					chatId: message.chatId,
					message: message.message,
				};

				const savedMessage = await Message.create(msg);

				message.User = message.fromUser;
				message.fromUserId = message.fromUser.id;
				message.id = savedMessage.id;
				message.message = savedMessage.message;
				message.createdAt = savedMessage.createdAt;
				delete message.fromUser;

				sockets.forEach((socket) => {
					io.to(socket).emit('received', message);
				});
			} catch (error) {
				// console.error(error);
				return [];
			}
		});

		socket.on('typing', async (message) => {
			message.toUserId.forEach((id) => {
				if (users.has(id)) {
					users.get(id).sockets.forEach((socket) => {
						io.to(socket).emit('typing', message);
					});
				}
			});
		});

		socket.on('add-friend', (chats) => {
			try {
				let online = 'offline';
				if (users.has(chats[1].Users[0].id)) {
					online = 'online';
					chats[0].Users[0].status = users.has(chats[0].Users[0].id)
						? 'online'
						: 'offline';
					users.get(chats[1].Users[0].id).sockets.forEach((socket) => {
						io.to(socket).emit('new-chat', chats[0]);
					});
				}

				if (
					/*users.has(chats[0].Users[0].id)*/
					chats[0].Users[0].status === 'online'
				) {
					chats[1].Users[0].status = online;
					users.get(chats[0].Users[0].id).sockets.forEach((socket) => {
						io.to(socket).emit('new-chat', chats[1]);
					});
				}
			} catch (error) {
				// console.error(error);
			}
		});

		socket.on('add-user-to-group', ({ chat, newChatter }) => {
			if (users.has(newChatter.id)) {
				newChatter.status = 'online';
			}

			// Old users
			chat.Users.forEach((user, index) => {
				if (users.has(user.id)) {
					chat.Users[index].status = 'online';
					users.get(user.id).sockets.forEach((socket) => {
						try {
							io.to(socket).emit('added-user-to-group', {
								chat,
								chatters: [newChatter],
							});
						} catch (error) {
							// console.error(error)
						}
					});
				}
			});

			// Send to new user
			if (users.has(newChatter.id)) {
				users.get(newChatter.id).sockets.forEach((socket) => {
					try {
						io.to(socket).emit('added-user-to-group', {
							chat,
							chatters: chat.Users,
						});
					} catch (error) {
						// console.error(error)
					}
				});
			}
		});

		socket.on('leave-current-chat', (data) => {
			const { chatId, userId, currentUserId, notifyUsers } = data;

			notifyUsers.forEach((id) => {
				if (users.has(id)) {
					users.get(id).sockets.forEach((socket) => {
						try {
							io.to(socket).emit('remove-user-from-chat', {
								chatId,
								userId,
								currentUserId,
							});
						} catch (error) {
							// console.error(error);
						}
					});
				}
			});
		});

		socket.on('delete-chat', (data) => {
			const { chatId, notifyUsers } = data;

			notifyUsers.forEach((id) => {
				if (users.has(id)) {
					users.get(id).sockets.forEach((socket) => {
						try {
							io.to(socket).emit('delete-chat', parseInt(chatId));
						} catch (error) {
							// console.error(error);
						}
					});
				}
			});
		});

		socket.on('requesting-a-dual-video-call', (data) => {
			if (data.toUsersId[0]) {
				data.toUsersId.map((id) => {
					users.get(data.toUsersId[0]).sockets.forEach((socket) => {
						io.to(socket).emit('requesting-a-dual-video-call', data);
					});
				});
			}
		});

		socket.on('disconnect', async () => {
			if (userSockets.has(socket.id)) {
				const user = users.get(userSockets.get(socket.id));

				if (user.sockets.length > 1) {
					user.sockets = user.sockets.filter((sock) => {
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
									// console.error(e);
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
	} catch (error) {
		// console.error(error);
		return [];
	}
};

module.exports = SocketServer;
