const express = require("express");
const router = express.Router();
const controller = require("../controller/Calarm");

// 알람목록
router.get("/", controller.getAlarm);

// 소켓 안읽은 메세지 알람추가
// router.post("/", controller.addAlarm);

// 알람삭제
router.delete("/", controller.deleteAlarm);

module.exports = router;
