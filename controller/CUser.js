const { where } = require("sequelize");
const { User } = require("../models");
const { validationResult } = require("express-validator"); // 유효성 검증
const passport = require("passport");

// 중복검사
exports.checkDuplicate = async (req, res) => {
    try {
        const { field, value } = req.body;

        const userInfo = await User.findOne({
            where: { [field]: value },
        });

        if (userInfo) {
            return res.send(false);
        } else {
            return res.send(true);
        }
    } catch {
        res.status(500).send("server error");
    }
};

// 회원가입
exports.postSignup = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // 유효성 검증 통과X
        return res.send({ errors: errors.array() });
    }

    const { id, pw, nickname, email } = req.body;

    try {
        await User.create({
            u_seq: null,
            id,
            pw,
            email,
            nickname,
            score: 0,
            connect: 0,
            image: "",
        });
        res.send(true);
    } catch {
        res.status(500).send("server error");
    }
};

// 로그인
exports.postSignin = (req, res, next) => {
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
    })(req, res, next); // authenticate()는 미들웨어 함수를 반환함
};

// 로그아웃
exports.getLogout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        // 로그아웃 성공(현재의 세션상태를 session에 저장한 후 리다이렉트)
        req.session.save((err) => {
            return res.redirect("/");
        });
    });
};
