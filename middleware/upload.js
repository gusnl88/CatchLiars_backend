const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads", "profile")); // 프로필 이미지가 저장될 경로
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname); // 파일 확장자
        cb(null, path.basename(file.originalname, ext) + "-" + Date.now() + ext); // 파일명 생성
    },
});

const uploadPhoto = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 파일 크기 제한
});

module.exports = uploadPhoto;
