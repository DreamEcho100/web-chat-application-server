const router = require('express').Router();
const { update, search } = require('../controllers/userControllers');
const { auth } = require('../middleware/auth');
const { validate } = require('../validators');
const { rules: updateRules } = require('../validators/user/update');
const { userFile } = require('../middleware/fileUpload');

router.post('/update', [auth, userFile, updateRules, validate], update);
router.get('/search-users', auth, search);

module.exports = router;
