const multer = require('multer');
const fs = require('fs');
const path = require('path');

const getFileType = (file) => {
	const mimeType = file.mimetype.split('/');
	return mimeType[mimeType.length - 1];
};

const generateFileName = (request, file, cb) => {
	const extension = getFileType(file);

	const filename = `${Date.now()}-${Math.round(
		Math.random() * 1e9
	)}.${extension}`;
	cb(null, `${file.fieldname}-${filename}`);
};

const fileFilter = (request, file, cb) => {
	const extension = getFileType(file);

	const allowedTypes = /jpeg|jpg|png|gif|svg/;

	const passed = allowedTypes.test(extension);

	if (passed) {
		return cb(null, true);
	}

	return cb(null, false);
};

exports.userFile = ((req, res, next) => {
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			const { id } = req.user;
			const dest = `uploads/user/${id}`;

			fs.access(dest, (error) => {
				// if doens't exist
				if (error) {
					return fs.mkdir(dest, (error) => {
						cb(error, dest);
					});
				} else {
					// it does exist
					fs.readdir(dest, (error, files) => {
						if (error) throw error;

						for (const file of files) {
							fs.unlink(path.join(dest, file), (error) => {
								if (error) throw error;
							});
						}
					});

					return cb(null, dest);
				}
			});
		},
		filename: generateFileName,
	});

	return multer({ storage, fileFilter }).single('avatar');
})();
/*
exports.userFile = ((request, response, next) => {
	const storage = multer.diskStorage({
		destination: function (request, file, cb) {
			console.log(request.user);
			const { id } = request.user;
			const dest = `uploads/user/${id}`;

			fs.access(dest, (error) => {
				if (error) {
					return fs.mkdir(dest, (error) => {
						cb(error, dest);
					});
				} else {
					fs.readdir(dest, (error, files) => {
						if (error) {
							throw error;
						}

						let file;
						for (file of files) {
							fs.unlink(path.join(dest, file), (error) => {
								if (error) {
									throw error;
								}
							});
						}
					});

					return cb(null, dest);
				}
			});
		},
		filename: generateFileName, // function (request, file, cb) {},
	});

	return multer({ storage, fileFilter }).single('avatar');
})();
*/
