const express = require("express");
const router = express.Router();
const controller = require("../controller/Cinvitation");

// 초대 생성하기
router.post("/", controller.postInvitation);

// 초대 목록 조회
router.get("/list/:type", controller.getInvitation);

// 초대 수락하기
router.post("/accept", controller.acceptInvitation);

// 초대 삭제하기
router.delete("/", controller.deleteInvitation);

module.exports = router;
