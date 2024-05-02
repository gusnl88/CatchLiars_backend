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
        return res.status(500).send("server error");
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
        return res.send(true);
    } catch (error) {
        console.log("error", error);
        return res.status(500).send("server error");
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
            return res.status(200).json(userInfo);
        });
    })(req, res, next); // authenticate()는 미들웨어 함수를 반환함
};

// 로그인시 접속 상태 변경
exports.patchStateTrue = async (req, res) => {
    // const nowUser = req.session.passport; // 현재 유저 확인
    if (req.user.dataValues.id) {
        try {
            await User.update(
                {
                    connect: 1,
                },
                {
                    where: { u_seq: req.user.dataValues.u_seq },
                }
            );
            return res.send(true);
        } catch {
            return res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 로그아웃시 접속 상태 변경
exports.patchStateFalse = async (req, res) => {
    // const nowUser = req.session.passport; // 현재 유저 확인
    if (req.user) {
        try {
            await User.update(
                {
                    connect: 0,
                },
                {
                    where: { u_seq: req.user.dataValues.u_seq },
                }
            );
            return res.send(true);
        } catch {
            return res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 로그아웃
exports.getLogout = (req, res) => {
    console.log("로그아웃하는 유저 세션 정보", req.session.passport);
    req.logout((err) => {
        if (err) {
            return res.send(false);
        }
        // 로그아웃 성공(현재의 세션상태를 session에 저장한 후 리다이렉트)
        req.session.save((err) => {
            return res.send(true);
        });
    });
};

// mypage관련
exports.getProfile = async (req, res) => {
    try {
        if (req.user.dataValues.id) {
            const userInfo = await User.findOne({
                where: {
                    u_seq: req.user.dataValues.u_seq,
                },
            });
            if (userInfo) return res.send(userInfo);
            else return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
        } else {
            return res.status(401).json({ message: "로그인이 필요합니다." });
        }
    } catch (error) {
        return res.status(500).json({ message: "프로필 조회 실패" });
    }
};

exports.patchUserProfile = async (req, res) => {
    try {
        const loggedInUserID = req.user.dataValues.id;
        const userIDFromClient = req.body.id;

        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const { currentPassword, newPassword, nickname, email } = req.body;

        // 비밀번호 확인을 위해 클라이언트에서 현재 비밀번호도 전송되었는지 확인
        if (!currentPassword) {
            return res.status(400).send("현재 비밀번호를 입력해주세요.");
        }

        // 현재 비밀번호가 맞는지 확인
        const user = await User.findOne({ where: { id: loggedInUserID } });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.pw);
        if (!isPasswordCorrect) {
            return res.status(401).send("현재 비밀번호가 일치하지 않습니다.");
        }

        // 새 비밀번호가 전송되지 않았을 경우 기존 비밀번호를 유지
        let updatedUser;
        if (newPassword) {
            // 새 비밀번호를 암호화하여 업데이트
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            updatedUser = { nickname, email, pw: hash };
        } else {
            updatedUser = { nickname, email };
        }

        // 유저 정보 업데이트
        await User.update(updatedUser, { where: { id: loggedInUserID } });

        return res.send(true);
    } catch (error) {
        console.error("프로필 정보 업데이트 실패", error);
        return res.status(500).send("프로필 정보 업데이트 실패");
    }
};

exports.patchUserImage = async (req, res) => {
    try {
        const loggedInUserID = req.user.dataValues.id;
        const userIDFromClient = req.body.id;

        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const updatedUser = {
            image: req.file ? req.file.path : null, // 파일이 있으면 경로 저장, 없으면 null
        };

        await User.update(updatedUser, { where: { id: loggedInUserID } });
        req.session.data.image = updatedUser.image;
    } catch (error) {
        console.error("프로필 이미지 업데이트 실패", error);
        return res.status(500).send("프로필 이미지 업데이트 실패");
    }
};

// 탈퇴하기
exports.deleteUser = async (req, res) => {
    const loggedInUserID = req.user.dataValues.id;
    const userIDFromClient = req.body.id;
    const currentPassword = req.body.currentPassword; // 클라이언트에서 현재 비밀번호 받기

    if (loggedInUserID !== userIDFromClient) {
        return res.status(403).send("권한이 없습니다.");
    }

    try {
        // 현재 비밀번호 확인
        const user = await User.findOne({ where: { id: loggedInUserID } });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.pw);
        if (!isPasswordCorrect) {
            return res.status(401).send("현재 비밀번호가 일치하지 않습니다.");
        }

        // 비밀번호가 일치하면 유저 삭제
        await User.destroy({ where: { id: loggedInUserID } });

        // 세션 및 쿠키 제거
        req.session.destroy((err) => {
            if (err) {
                console.error("세션 삭제 실패:", err);
                return res.status(500).send("서버에러");
            }
            res.clearCookie("sessionID");
            res.send(true); // 탈퇴 성공
        });
    } catch (error) {
        console.error("회원 탈퇴 실패:", error);
        res.status(500).send("회원 탈퇴 실패");
    }
};

// 유저 랭킹 목록(임시로 상위 50명-)
exports.getLank = async (req, res) => {
    try {
        const userList = await User.findAll({
            limit: 50,
            order: [["score", "DESC"]],
        });
        return res.send(userList);
    } catch {
        return res.status(500).send("server error");
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
        return res.send(true);
    } catch {
        return res.status(500).send("server error");
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
        return res.send(userList);
    } catch {
        return res.status(500).send("server error");
    }
};
