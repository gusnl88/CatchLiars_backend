const express = require("express");
const router = express.Router();
const controller = require("../controller/Cgame");

// 게임방 생성
router.post("/", controller.postGame);

// 게임 전체 목록 조회
router.get("/:type", controller.getGame);

// 게임방 설정 변경
router.patch("/:g_seq", controller.patchGame);

// 게임방 삭제
router.delete("/:g_seq", controller.deleteGame);

module.exports = router;
