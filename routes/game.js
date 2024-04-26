const express = require("express");
const router = express.Router();
const controller = require("../controller/Cgame");

// 게임방 생성
router.post("/", controller.postGame);

// 게임 전체 목록 조회
router.get("/list/:type", controller.getGame);

// 게임방 설정 변경
router.patch("/setting/:g_seq", controller.patchGameSetting);

// 게임방 인원 변경
router.patch("/plus/:g_seq", controller.patchPlus);
router.patch("/minus/:g_seq", controller.patchMinus);

// 게임방 삭제
router.delete("/:g_seq", controller.deleteGame);

module.exports = router;
