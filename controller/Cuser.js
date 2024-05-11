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
        // 로그인 에러, 로그인 유저정보, 로그인 실패
        if (authErr) next(authErr);
        if (!userInfo) {
            return res.send(false);
        }
        req.login(userInfo, (loginErr) => {
            if (loginErr) {
                next(loginErr);
            }
            req.session.user = {
                u_seq: userInfo.u_seq,
                id: userInfo.id,
                nickname: userInfo.nickname,
            };
            return res.status(200).json(userInfo);
        });
    })(req, res, next);
};

// 로그인시 접속 상태 변경
exports.patchStateTrue = async (req, res) => {
    try {
        if (req.session.user.u_seq) {
            await User.update(
                {
                    connect: 1,
                },
                {
                    where: { u_seq: req.session.user.u_seq },
                }
            );
            return res.send(true);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 로그아웃시 접속 상태 변경
exports.patchStateFalse = async (req, res) => {
    try {
        if (req.session.user) {
            await User.update(
                {
                    connect: 0,
                },
                {
                    where: { u_seq: req.session.user.u_seq },
                }
            );
            return res.send(true);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 유저 세션 확인
exports.getSession = async (req, res) => {
    if (req.isAuthenticated() && req.session.user) {
        res.status(200).json(req.session.user);
    } else {
        // 세션이 만료된 경우 또는 로그인되지 않은 경우
        try {
            await User.update(
                {
                    connect: 0,
                },
                {
                    where: { u_seq: req.session.user.u_seq },
                }
            );
            return res.send(true);
        } catch {
            return res.send(false);
        }
    }
};

// 로그아웃
exports.getLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.send(false);
        }
        // 로그아웃 성공(현재의 세션상태를 session에 저장)
        req.session.save((err) => {
            return res.send(true);
        });
    });
};

// 마이페이지 정보 요청
exports.getProfile = async (req, res) => {
    try {
        if (req.session.user.u_seq) {
            const userInfo = await User.findOne({
                where: {
                    u_seq: req.session.user.u_seq,
                },
            });
            if (userInfo) return res.send(userInfo);
            else return res.status(404).json({ message: "사용자 정보를 찾을 수 없습니다." });
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 마이페이지 정보 수정
exports.patchUserProfile = async (req, res) => {
    try {
        const loggedInUserID = req.session.user.id;
        const userIDFromClient = req.body.id;

        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const { currentPassword, newPassword, nickname, email } = req.body;

        if (!currentPassword) {
            return res.status(400).send("현재 비밀번호를 입력해주세요.");
        }

        const user = await User.findOne({ where: { id: loggedInUserID } });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.pw);
        if (!isPasswordCorrect) {
            return res.status(401).send("현재 비밀번호가 일치하지 않습니다.");
        }

        let updatedUser;
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            updatedUser = { nickname, email, pw: hash };
        } else {
            updatedUser = { nickname, email };
        }
        await User.update(updatedUser, { where: { id: loggedInUserID } });

        return res.send(true);
    } catch (error) {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 마이페이지 이미지 수정
exports.patchUserImage = async (req, res) => {
    try {
        const loggedInUserID = req.session.user.id;
        const userIDFromClient = req.body.id;

        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const updatedUser = {
            image: req.file ? req.file.path : null,
        };

        await User.update(updatedUser, { where: { id: loggedInUserID } });
        req.session.user.image = updatedUser.image;
        return res.send(updatedUser.image);
    } catch {
        return res.status(500).send("프로필 이미지 업데이트 실패");
    }
};

// 탈퇴
exports.deleteUser = async (req, res) => {
    const loggedInUserID = req.session.user.id;
    const userIDFromClient = req.body.id;
    const currentPassword = req.body.currentPassword;

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
        await User.destroy({ where: { id: loggedInUserID } });

        // 세션 및 쿠키 제거
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send("서버에러");
            }
            res.clearCookie("user");
            return res.send(true); // 탈퇴 성공
        });
    } catch {
        return res.status(500).send("회원 탈퇴 실패");
    }
};

// 유저 랭킹 목록
exports.getLank = async (req, res) => {
    try {
        const userList = await User.findAll({
            limit: 30,
            order: [["score", "DESC"]],
        });
        return res.send(userList);
    } catch {
        return res.status(500).send("server error");
    }
};

// 유저 스코어 업데이트
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

// 유저 검색 (아이디 기준)
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
