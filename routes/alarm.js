const express = require("express");
const router = express.Router();
const controller = require("../controller/Calarm");

// 알람목록
router.get("/", controller.getAlarm);

// 알람삭제
router.delete("/", controller.deleteAlarm);

module.exports = router;
