const router = require('express').Router();
const { login, register } = require('../controllers/authController');
const { rules: registerRules } = require('../validators/auth/register');
const { rules: loginRules } = require('../validators/auth/login');
const { validate } = require('../validators');

router.post('/login', [loginRules, validate], login);

router.post('/register', [registerRules, validate], register);

module.exports = router;
