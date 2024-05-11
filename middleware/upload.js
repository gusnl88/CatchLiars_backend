const multer = require("multer");
const path = require("path");

const uploadProfile = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "uploads/profile");
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname);

            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadProfile;
