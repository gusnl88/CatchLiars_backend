const { Invitation, Friend } = require("../models");

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

    if (nowUser) {
        // 로그인된 사용자가 있을 경우
        if (!type) {
            // 친구신청
            const friend = await Friend.findOne({
                where: {
                    u_seq: nowUser.user.userInfo.u_seq,
                    c_seq: u_seq,
                },
            });

            if (friend) {
                // 이미 친구인 경우
                res.send("이미 존재하는 친구입니다.");
            }
        }
        await Invitation.create({
            u_seq,
            f_seq: nowUser.user.userInfo.u_seq,
            g_seq: last_g_seq,
            i_type: type,
        });
        res.send(true);
    } else {
        return res.send("로그인이 필요합니다.");
    }
};

// 초대 수락
exports.acceptInvitation = async (req, res) => {
    const { f_seq, type } = req.body; // 송신자, 초대 유형

    const nowUser = req.session.passport; // 현재 유저 확인

    if (nowUser) {
        if (type == 0) {
            // 친구초대 수락시, 기존에 이미 있는 친구인지 확인
            const friend = await Friend.findOne({
                where: {
                    u_seq: nowUser.user.userInfo.u_seq,
                    c_seq: f_seq,
                },
            });
            if (friend) {
                res.send("이미 존재하는 친구입니다.");
            } else {
                try {
                    await Friend.create({
                        // 수신자 친구생성
                        u_seq: nowUser.user.userInfo.u_seq,
                        c_seq: f_seq,
                    });
                    await Friend.create({
                        // 송신자 친구생성
                        u_seq: f_seq,
                        c_seq: nowUser.user.userInfo.u_seq,
                    });
                    res.send(true);
                } catch {
                    res.status(500).send("server error");
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
    if (nowUser) {
        try {
            const invitation = await Invitation.destroy({
                where: {
                    i_seq,
                    u_seq: nowUser.user.userInfo.u_seq,
                },
            });
            if (invitation) res.send(true);
            else res.send(false);
        } catch {
            res.status(500).send("server error");
        }
    } else {
        res.send("로그인이 필요합니다.");
    }
};

// 초대 목록 조회
// get /invites/list/:type
exports.getInvitation = async (req, res) => {
    const { type } = req.params; // 0: 친구초대 1: 게임초대
    const nowUser = req.session.passport; // 현재 유저 확인
    if (nowUser) {
        try {
            const invitationList = await Invitation.findAll({
                where: {
                    i_type: type,
                    u_seq: nowUser.user.userInfo.u_seq,
                },
                order: [["i_seq", "DESC"]],
            });
            res.send(invitationList);
        } catch (error) {
            res.status(500).send("server error");
        }
    } else {
        res.send("로그인이 필요합니다.");
    }
};
