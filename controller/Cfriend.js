const { Friend, User } = require("../models");

// 친구 목록 조회
exports.getFriend = async (req, res) => {
    try {
        if (req.session.user.u_seq) {
            const friendList = await Friend.findAll({
                where: {
                    u_seq: req.session.user.u_seq,
                },
                attributes: ["c_seq"],
                order: [["f_seq", "DESC"]],
            });
            const c_seqList = friendList.map((friend) => friend.dataValues.c_seq);
            let result = [];
            for (const c_seq of c_seqList) {
                const info = await User.findOne({
                    where: { u_seq: c_seq },
                });
                result.push(info.dataValues);
            }
            return res.send(result);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 친구 삭제하기
exports.deleteFriend = async (req, res) => {
    const { c_seq } = req.body;

    try {
        if (req.session.user.u_seq) {
            const friend1 = await Friend.destroy({
                where: {
                    u_seq: req.session.user.u_seq,
                    c_seq: c_seq,
                },
            });
            const friend2 = await Friend.destroy({
                where: {
                    u_seq: c_seq,
                    c_seq: req.session.user.u_seq,
                },
            });
            if (friend1 && friend2) return res.send(true);
            else return res.send(false);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};
