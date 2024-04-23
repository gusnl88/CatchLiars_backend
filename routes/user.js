const express = require("express");
const router = express.Router();
const controller = require("../controller/Cuser");
const { body } = require("express-validator"); // 유효성 검증
const passport = require("passport");

// post /users/signup
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

// post /users/check-duplicate
router.post("/check-duplicate", controller.checkDuplicate);

// post /users/signin
router.post("/signin", (req, res, next) => {
    passport.authenticate("local", (authErr, userInfo, authFail) => {
        // 로그인 에러, 로그인 유저정보, 로그인 실패
        if (authErr) next(authErr);
        if (!userInfo) {
            return res.send({
                loginSuccess: false,
                message: authFail,
            });
        }
        req.logIn(userInfo, (loginErr) => {
            if (loginErr) {
                next(loginErr);
            }
            res.send({ loginSuccess: true });
        });
    })(req, res, next);
});

// get /users/logout
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        // 로그아웃 성공(현재의 세션상태를 session에 저장한 후 리다이렉트)
        req.session.save((err) => {
            return res.redirect("/");
        });
    });
});

module.exports = router;
