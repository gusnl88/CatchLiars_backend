const express = require("express");
const router = express.Router();
const controller = require("../controller/Cuser");
const { body } = require("express-validator"); // 유효성 검증

// 회원가입
router.post(
    "/signup",
    [
        body("id")
            .trim()
            .exists()
            .withMessage("아이디를 입력해주세요.")
            .bail()
            .isLength({ min: 5 })
            .withMessage("아이디를 5글자 이상 입력해주세요.")
            .bail(),
        body("pw")
            .trim()
            .exists()
            .withMessage("비밀번호를 입력해주세요.")
            .bail()
            .isLength({ min: 5 })
            .withMessage("비밀번호를 5글자 이상 입력해주세요.")
            .bail(),
        body("nickname")
            .trim()
            .exists()
            .withMessage("닉네임을 입력해주세요.")
            .bail()
            .isLength({ min: 2 })
            .withMessage("닉네임을 3글자 이상 입력해주세요.")
            .bail(),
        body("email")
            .trim()
            .exists()
            .withMessage("이메일을 입력해주세요.")
            .bail()
            .isEmail()
            .withMessage("이메일 형식으로 입력해주세요.")
            .bail(),
    ],
    controller.postSignup
);

// 중복검사
router.post("/check-duplicate", controller.checkDuplicate);

// 로그인
router.post("/signin", controller.postSignin);

// 로그아웃
router.get("/logout", controller.getLogout);

module.exports = router;
