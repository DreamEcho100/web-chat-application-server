const Pool = require('pg').Pool;
const { dbPassword } = require('../config/app');

const pool = new Pool({
	user: 'postgres',
	password: dbPassword,
	database: 'chat_app',
	host: 'localhost',
	port: 5432,
});

module.exports = pool;
