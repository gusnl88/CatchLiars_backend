const { Friend, User } = require("../models");

// 친구 목록 조회
exports.getFriend = async (req, res) => {
    const nowUser = req.session.passport; // 현재 유저 확인
    if (nowUser.user === req.user.dataValues.id) {
        try {
            const friendList = await Friend.findAll({
                where: {
                    u_seq: req.user.dataValues.u_seq,
                },
                attributes: ["c_seq"],
                order: [["f_seq", "DESC"]],
            });
            const c_seqList = friendList.map((friend) => friend.dataValues.c_seq);
            let result = [];
            for (const c_seq of c_seqList) {
                // 비동기 코드의 결과를 기다린 후 반복문 진행
                const info = await User.findOne({
                    where: { u_seq: c_seq },
                });
                result.push(info.dataValues);
            }
            res.send(result);
        } catch (error) {
            console.log("error", error);
            res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 친구 삭제하기
exports.deleteFriend = async (req, res) => {
    const nowUser = req.session.passport; // 현재 유저 확인
    const { c_seq } = req.body;
    const userInfo = req.user.dataValues;
    if (nowUser.user === req.user.dataValues.id) {
        try {
            // 삭제를 한 유저
            const friend1 = await Friend.destroy({
                where: {
                    u_seq: userInfo.u_seq,
                    c_seq: c_seq,
                },
            });
            // 삭제를 당한 유저
            const friend2 = await Friend.destroy({
                where: {
                    u_seq: c_seq,
                    c_seq: userInfo.u_seq,
                },
            });
            if (friend1 && friend2) res.send(true);
            else res.send(false);
        } catch {
            res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};
