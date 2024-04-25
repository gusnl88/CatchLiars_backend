const express = require("express");
const router = express.Router();
const controller = require("../controller/Cfriend");

// 친구 목록 조회
router.get("/", controller.getFriend);

// 친구 삭제
router.delete("/", controller.deleteFriend);

module.exports = router;
