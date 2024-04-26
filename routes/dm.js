const express = require("express");
const router = express.Router();
const controller = require("../controller/Cdm");

// 디엠방 목록
router.get("/DM", controller.getDM);
// 디엠방 1개 선택
router.get("/DM/:d_seq", controller.getDMOne);
// 디엠방 생성
router.post("/DM", controller.postDM);
// 디엠방 삭제
router.delete("/DM/:d_seq", controller.deleteDM);

module.exports = router;
