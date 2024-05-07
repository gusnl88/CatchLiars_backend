const express = require("express");
const router = express.Router();
const controller = require("../controller/Cuser");
const { body } = require("express-validator"); // 유효성 검증
const multer = require("../middleware/upload");

// 회원가입
router.post(
    "/signup",
    [
        body("id")
            .trim()
            .exists()
            .withMessage("아이디를 입력해주세요.")
            .bail()
            .isLength({ min: 5, max: 12 })
            .withMessage("아이디는 5~12자로 입력해주세요.")
            .bail(),
        body("pw")
            .trim()
            .exists()
            .withMessage("비밀번호를 입력해주세요.")
            .bail()
            .isLength({ min: 5, max: 10 })
            .withMessage("비밀번호는 5~10자로 입력해주세요.")
            .bail(),
        body("nickname")
            .trim()
            .exists()
            .withMessage("닉네임을 입력해주세요.")
            .bail()
            .isLength({ min: 3 })
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

// 유저 로그인 접속 업데이트
router.patch("/stateTrue", controller.patchStateTrue);

// 유저 로그아웃 접속 업데이트
router.patch("/stateFalse", controller.patchStateFalse);

// 유저 세션 확인
router.get("/check", controller.getSession);

// 프로필 목록
router.get("/myPage", controller.getProfile);

// 프로필 수정
router.patch("/myPage", controller.patchUserProfile);

// 프로필 이미지 수정
router.patch("/mypage/image", multer.single("fileInput"), controller.patchUserImage);

// 탈퇴하기
router.delete("/myPage", controller.deleteUser);

// 유저 랭킹 목록
router.get("/lank", controller.getLank);

// 유저 스코어 업데이트
router.patch("/score", controller.patchScore);

// 유저 검색
router.get("/search", controller.getUser);

module.exports = router;
