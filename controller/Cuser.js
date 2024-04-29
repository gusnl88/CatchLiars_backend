const { User } = require("../models");
const { validationResult } = require("express-validator"); // 유효성 검증
const passport = require("passport");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");


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
        // 비밀번호 암호화
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(pw, salt);

        await User.create({
            u_seq: null,
            id: id,
            pw: hash,
            email: email,
            nickname: nickname,
            score: 0,
            connect: 0,
            image: null,
        });
        res.send(true);
    } catch (error) {
        console.log("error", error);
        res.status(500).send("server error");
    }
};

// 로그인
exports.postSignin = (req, res, next) => {
    passport.authenticate("local", (authErr, userInfo, authFail) => {
        console.log("로그인된 유저정보", userInfo);
        // 로그인 에러, 로그인 유저정보, 로그인 실패
        if (authErr) next(authErr);
        if (!userInfo) {
            // 로그인 실패
            return res.send(false);
        }
        req.logIn(userInfo, (loginErr) => {
            if (loginErr) {
                next(loginErr);
            }
            res.status(200).json(true);
        });
    })(req, res, next); // authenticate()는 미들웨어 함수를 반환함
};

// 유저 접속 업데이트
exports.patchUserState = async (req, res) => {
    const nowUser = req.session.passport; // 현재 유저 확인
    const newState = !req.user.dataValues.connect;
    if (nowUser.user === req.user.dataValues.id) {
        try {
            await User.update(
                {
                    connect: newState,
                },
                {
                    where: { u_seq: req.user.dataValues.u_seq },
                }
            );
            res.send(true);
        } catch {
            res.status(500).send("server error");
        }
    } else {
        res.send("로그인이 필요합니다.");
    }
};

// 로그아웃
exports.getLogout = (req, res) => {
    console.log("로그아웃하는 유저 세션 정보", req.session.passport);
    req.logout((err) => {
        if (err) {
            return res.redirect("/");
        }
        // 로그아웃 성공(현재의 세션상태를 session에 저장한 후 리다이렉트)
        req.session.save((err) => {
            return res.redirect("/");
        });
    });
};

// mypage관련
exports.getProfile = async (req, res) => {
    try {
        if (req.session.id) {
            const userData = await model.User.findOne({
                where: { u_seq: req.session.data.u_seq },
            });
            res.status(200).json(userData);
        } else {
            res.status(401).json({ message: "로그인이 필요합니다." });
        }
    } catch (error) {
        console.error("프로필 조회 실패", error);
        res.status(500).json({ message: "프로필 조회 실패" });
    }
};
exports.postProfile = (req, res) => {
    model.User.findOne({
        where: {
            id: req.session.id,
        },
    })
        .then((result) => {
            if (!result) {
                return res.status(404).send("사용자 정보를 찾을 수 없습니다.");
            }
            // console.log("프로필페이지", result);
            res.render("profileEdit", { data: result });
        })
        .catch(() => {
            //console.log("프로필 조회 실패");
            res.send(500).send("프로필 조회 실패");
        });
};
exports.editUser = async (req, res) => {
    try {
        const loggedInUserID = req.session.id;
        const userIDFromClient = req.body.id;
        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const updatedUser = {
            pw: hashPW(req.body.pw),
            nickname: req.body.nickname,
            email: req.body.email,
            image: req.file ? req.file.path : null, // 파일이 있으면 경로 저장, 없으면 null
        };

        await model.User.update(updatedUser, { where: { id: loggedInUserID } });
        req.session.data.image = updatedUser.image;
        return res.redirect("/myPage");
    } catch (error) {
        console.error("프로필 정보 업데이트 실패", error);
        return res.status(500).send("프로필 정보 업데이트 실패");
    }
};

exports.uploadProfile = (req, res) => {
    console.log(req.file); // 파일 정보
    console.log(req.body); // 텍스트 정보
    res.send("파일 업로드 완료");
};

// // 탈퇴하기
// exports.deleteUser = (req, res) => {
//     const user = req.session.id;
//     const userIDFromClient = req.body.id;

//     if (user !== userIDFromClient) {
//         return res.status(403).send("권한이 없습니다.");
//     }

//     model.User.destroy({
//         where: { id: u_seq },
//     })
//         .then(() => {
//             req.session.destroy((err) => {
//                 if (err) {
//                     console.error("세션 삭제 실패:", err);
//                     return res.status(500).send("서버에러");
//                 }
//                 res.clearCookie("sessionID");
//                 res.redirect("/");
//             });
//         })
//         .catch((err) => {
//             console.error("회원 탈퇴 실패:", err);
//             res.status(500).send("회원 탈퇴 실패");
//         });
// };

// 유저 랭킹 목록(임시로 상위 50명-)
exports.getLank = async (req, res) => {
    try {
        const userList = await User.findAll({
            limit: 50,
            order: [["score", "DESC"]],
        });
        res.send(userList);
    } catch {
        res.status(500).send("server error");
    }
};

// 유저 스코어 업데이트(임시로 한 판 승리할 때마다 2점씩 증가-)
exports.patchScore = async (req, res) => {
    const { u_seq } = req.body;

    try {
        const userInfo = await User.findOne({
            where: { u_seq: u_seq },
            attributes: ["score"],
        });
        await User.update({ score: userInfo.dataValues.score + 2 }, { where: { u_seq } });
        res.send(true);
    } catch {
        res.status(500).send("server error");
    }
};


// 유저 검색 (아이디)
// get /games/search?keyword=~
exports.getUser = async (req, res) => {
    try {
        const { keyword } = req.query;

        const userList = await User.findAll({
            where: {
                id: { [Op.like]: `%${keyword}%` },
            },
        });
        res.send(userList);
    } catch {
        res.status(500).send("server error");
    }
};

