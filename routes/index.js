const express = require("express");
const router = express.Router();
const controller = require("../controller/CMain");
const multer = require("../middleware/upload");

// GET /
router.get("/", controller.getIndex);
router.get("/myPage", controller.getProfile);

router.post("/myPage", controller.postProfile);
router.post("/editUser", multer.uploadProfile.single("fileInput"), controller.editUser);

module.exports = router;
