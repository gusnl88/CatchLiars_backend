const { Op, where } = require("sequelize");
const { DM, Message, User } = require("../models");
const passport = require("passport");

// dm방 전체목록 조회
exports.getDM = async (req, res) => {
    try {
        const user = req.session.user;
        if (user) {
            // 사용자의 u_seq와 f_seq가 모두 해당하는 DM을 찾음
            const userDM = await DM.findAll({
                where: {
                    [Op.or]: [{ u_seq: user.u_seq }, { f_seq: user.u_seq }],
                },
                order: [["updatedAt", "DESC"]],
            });

            // 상대방의 정보를 userDM 배열에 추가
            for (const DM of userDM) {
                if (DM.dataValues.f_seq !== user.u_seq) {
                    const counterInfo = await User.findOne({
                        where: { u_seq: DM.dataValues.f_seq },
                        attributes: ["id", "image", "connect"],
                    });
                    DM.dataValues.counterInfo = counterInfo.dataValues;
                } else {
                    const counterInfo = await User.findOne({
                        where: { u_seq: DM.dataValues.u_seq },
                        attributes: ["id", "image", "connect"],
                    });
                    DM.dataValues.counterInfo = counterInfo.dataValues;
                }
            }
            return res.send({ dmInfo: userDM });
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

////////////////// 코드 정리 필요
// DM방 상세보기
exports.getDMOne = async (req, res) => {
    const { d_seq } = req.body;
    try {
        const currentUser = req.session.user;
        if (currentUser) {
            const userDM = await DM.findOne({
                where: { d_seq: d_seq },
            });

            if (!userDM) {
                return res.status(404).send("DM room not found");
            }

            const messages = await Message.findAll({
                where: { d_seq: d_seq },
            });

            // 메시지의 읽음여부를 0에서 1로 변경
            await Message.update(
                { is_read: 1 },
                { where: { d_seq: d_seq, u_seq: { [Op.ne]: currentUser.u_seq } } } // 현재 사용자가 아닌 상대방의 메시지만 업데이트
            );

            // 읽지 않은 메세지의 개수를 업데이트
            const unreadMessagesCount = await Message.count({
                where: {
                    d_seq: d_seq,
                    is_read: 0,
                    u_seq: currentUser.u_seq, // 현재 사용자가 아닌 상대방의 메시지 카운트
                },
            });

            // unreadMessagesCount가 0이면 모든 메시지가 읽혔으므로 unreadcnt를 0에서 1로 변경
            if (unreadMessagesCount === 0) {
                await DM.update({ unreadcnt: 1 }, { where: { d_seq: d_seq } });
            }

            return res.send({ userDM, messages });
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// dm방 생성
exports.postDM = async (req, res) => {
    const { firstUser, secondUser } = req.body;
    try {
        if (!firstUser || !secondUser) {
            return res.status(400).send("First user and second user must be provided.");
        }

        const existingDM = await DM.findOne({
            where: {
                [Op.or]: [
                    { u_seq: firstUser, f_seq: secondUser },
                    { u_seq: secondUser, f_seq: firstUser },
                ],
            },
        });

        if (!existingDM) {
            const newDM = await DM.create({
                u_seq: firstUser,
                f_seq: secondUser,
            });
            return res.send(newDM);
        } else {
            return res.send(existingDM);
        }
    } catch {
        return res.status(500).send("Server Error");
    }
};

// dm방 삭제
exports.deleteDM = async (req, res) => {
    const { d_seq } = req.body;

    try {
        const dm = await DM.findByPk(d_seq);

        if (!dm) {
            return res.status(404).send("DM room not found");
        }

        return res.send(true);
    } catch {
        return res.status(500).send("Server Error");
    }
};
