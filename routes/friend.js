const express = require("express");
const router = express.Router();
const controller = require("../controller/Cfriend");

// 친구 생성하기
router.post("/", controller.postFriend);

module.exports = router;
