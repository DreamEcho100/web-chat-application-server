require('dotenv').config();

module.exports = {
	appKey: process.env.APP_Key,
	appPort: process.env.APP_PORT,
	appUrl: process.env.APP_URL,
	dbPassword: process.env.DBPASSWORD,
};
