const { Op, where } = require("sequelize");
const { DM, Message, User } = require("../models");
const passport = require("passport");

// dm방 전체목록 조회
exports.getDM = async (req, res) => {
    console.log("진입");
    try {
        const user = req.session.user;
        if (user) {
            // 사용자의 u_seq와 f_seq가 모두 해당하는 DM을 찾음
            const userDM = await DM.findAll({
                where: {
                    [Op.or]: [
                        { u_seq: user.u_seq }, // 사용자의 u_seq가 일치하는 경우
                        { f_seq: user.u_seq }, // 사용자의 f_seq가 일치하는 경우
                    ],
                },
                order: [["d_seq", "DESC"]],
            });
            console.log(userDM, "userdm");

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
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(401).send("로그인이 필요합니다");
    }
};

// DM방 1개 선택 및 지난 메시지 목록 조회
exports.getDMOne = async (req, res) => {
    const { d_seq } = req.body; // URL에서 d_seq 추출
    try {
        if (req.session.user) {
            const currentUser = req.session.user; // 현재 사용자 정보

            // DM 방 조회
            const userDM = await DM.findOne({
                where: { d_seq: d_seq },
            });

            if (!userDM) {
                return res.status(404).send("DM room not found");
            }

            // 해당 DM 방에 있는 모든 메시지를 가져옴
            const messages = await Message.findAll({
                where: { d_seq: d_seq },
            });

            // 메시지의 is_read를 0에서 1로 변경
            await Message.update(
                { is_read: 1 }, // is_read를 1로 변경
                { where: { d_seq: d_seq, u_seq: { [Op.ne]: currentUser.u_seq } } } // 현재 사용자가 아닌 상대방의 메시지만 업데이트
            );

            // 모든 메시지가 읽혔는지 확인하고 unreadcnt를 조정
            const unreadMessagesCount = await Message.count({
                where: {
                    d_seq: d_seq,
                    is_read: 0, // 아직 읽지 않은 메시지만 카운트
                    u_seq: currentUser.u_seq, // 현재 사용자가 아닌 상대방의 메시지 카운트
                },
            });

            // unreadMessagesCount가 0이면 모든 메시지가 읽혔으므로 unreadcnt를 0에서 1로 변경
            if (unreadMessagesCount === 0) {
                await DM.update(
                    { unreadcnt: 1 }, // unreadcnt를 1로 변경
                    { where: { d_seq: d_seq } }
                );
            }

            res.send({ userDM, messages });
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

        // 이미 생성된 DM 중에서 f_seq와 일치하는 DM이 있는지 확인
        const existingDM = await DM.findOne({
            where: {
                [Op.or]: [
                    { u_seq: firstUser, f_seq: secondUser },
                    { u_seq: secondUser, f_seq: firstUser },
                ],
            },
        });

        // 이미 생성된 DM이 없으면 새로운 DM 생성
        if (!existingDM) {
            const newDM = await DM.create({
                u_seq: firstUser,
                f_seq: secondUser,
            });
            return res.send(newDM);
        } else {
            return res.send(existingDM);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

// 시간되면 -> 삭제원하는 해당 유저의 u_seq만 사라지고 u_seq가 0이되면 dm방이 삭제되도록 로직 바꾸기
// dm방 삭제
exports.deleteDM = async (req, res) => {
    const { d_seq } = req.body;
    const { u_seq } = req.session.user; // 현재 사용자의 u_seq

    try {
        // DM을 조회하여 해당 DM의 정보를 가져옴
        const dm = await DM.findByPk(d_seq);

        // DM이 존재하지 않는 경우
        if (!dm) {
            return res.status(404).send("DM room not found");
        }

        // DM에서 현재 유저의 u_seq를 삭제
        await dm.destroy(u_seq); // 현재 유저의 u_seq 삭제

        res.send(true); // 삭제 성공 시 true를 클라이언트에게 응답으로 보냄
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
