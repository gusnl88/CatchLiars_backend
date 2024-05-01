const { Invitation, Friend, User } = require("../models");

// 초대 발송
exports.postInvitation = async (req, res) => {
    var last_g_seq;
    const { u_seq, type, g_seq } = req.body; // 친구의 u_seq
    if (g_seq === "") {
        last_g_seq = null;
    } else {
        last_g_seq = g_seq;
    }

    const nowUser = req.session.passport; // 현재 유저 확인

    if (nowUser.user === req.user.dataValues.id) {
        // 로그인된 사용자가 있을 경우
        if (!type) {
            // 친구신청
            const friend = await Friend.findOne({
                where: {
                    u_seq: req.user.dataValues.u_seq,
                    c_seq: u_seq,
                },
            });

            if (friend) {
                // 이미 친구인 경우
                return res.send("이미 존재하는 친구입니다.");
            }
        }
        // 이미 초대를 보낸 경우
        const invitation = await Invitation.findOne({
            where: {
                f_seq: req.user.dataValues.u_seq,
                u_seq: u_seq,
            },
        });
        if (invitation) {
            if (!type) {
                return res.send("이미 친구 신청을 완료하셨습니다.");
            }
        } else {
            await Invitation.create({
                u_seq,
                f_seq: req.user.dataValues.u_seq,
                g_seq: last_g_seq,
                i_type: type,
            });
            return res.send(true);
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 초대 수락
exports.acceptInvitation = async (req, res) => {
    const { f_seq, type } = req.body; // 수신자, 초대 유형

    if (f_seq === req.user.dataValues.id) {
        return res.send("친구신청은 본인에게 할 수 없습니다.");
    }

    const nowUser = req.session.passport; // 현재 유저 확인

    if (nowUser.user === req.user.dataValues.id) {
        if (type == 0) {
            // 친구초대 수락시, 기존에 이미 있는 친구인지 확인
            const friend = await Friend.findOne({
                where: {
                    u_seq: req.user.dataValues.u_seq,
                    c_seq: f_seq,
                },
            });
            if (friend) {
                return res.send("이미 존재하는 친구입니다.");
            } else {
                try {
                    await Friend.create({
                        // 수신자 친구생성
                        u_seq: req.user.dataValues.u_seq,
                        c_seq: f_seq,
                    });
                    await Friend.create({
                        // 송신자 친구생성
                        u_seq: f_seq,
                        c_seq: req.user.dataValues.u_seq,
                    });
                    return res.send(true);
                } catch {
                    return res.status(500).send("server error");
                }
            }
        }
    } else {
        res.send("로그인이 필요합니다.");
    }
};

// 초대 거절 및 삭제( 초대 수락 후 삭제)
exports.deleteInvitation = async (req, res) => {
    const { i_seq } = req.body;

    const nowUser = req.session.passport; // 현재 유저 확인
    if (nowUser.user === req.user.dataValues.id) {
        try {
            const invitation = await Invitation.destroy({
                where: {
                    i_seq,
                    u_seq: req.user.dataValues.u_seq,
                },
            });
            if (invitation) res.send(true);
            else return res.send(false);
        } catch {
            return res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 초대 목록 조회
// get /invites/list
exports.getInvitation = async (req, res) => {
    const nowUser = req.session.passport; // 현재 유저 확인

    if (nowUser.user === req.user.dataValues.id) {
        try {
            const invitationList = await Invitation.findAll({
                where: {
                    u_seq: req.user.dataValues.u_seq,
                },
                order: [["i_seq", "DESC"]],
            });
            const f_seqList = invitationList.map((invitation) => invitation.dataValues.f_seq);
            let result = [];
            for (const f_seq of f_seqList) {
                const info = await User.findOne({
                    where: { u_seq: f_seq },
                    attributes: ["nickname"],
                });
                result.push(info.dataValues.nickname);
            }
            return res.send({ invitationList: invitationList, nickname: result });
        } catch (error) {
            return res.status(500).send("server error");
        }
    } else {
        return res.send("로그인이 필요합니다.");
    }
};
