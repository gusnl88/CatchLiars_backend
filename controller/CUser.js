const { where } = require("sequelize");
const { User } = require("..//models");
const { validationResult } = require("express-validator"); // 유효성 검증

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
