const { DM, Message } = require("../models");
const passport = require("passport");

// dm방 전체목록 조회
exports.getDM = async (req, res) => {
    try {
        if (req.session.u_seq) {
            const u_seq = req.session.u_seq;

            // 사용자의 u_seq와 f_seq가 모두 해당하는 DM을 찾음
            const userDM = await DM.findAll({
                where: {
                    [Op.or]: [
                        { u_seq: u_seq }, // 사용자의 u_seq가 일치하는 경우
                        { f_seq: u_seq }, // 사용자의 f_seq가 일치하는 경우
                    ],
                },
            });

            res.send(userDM);
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// DM방 1개 선택 및 지난 메시지 목록 조회
exports.getDMOne = async (req, res) => {
    const { d_seq } = req.params; // URL에서 d_seq 추출
    try {
        if (req.session.u_seq) {
            const u_seq = req.session.u_seq; // 현재 사용자의 u_seq

            // DM 방 조회
            const userDM = await DM.findOne({
                where: { d_seq: d_seq },
            });

            if (!userDM) {
                return res.status(404).send("DM room not found");
            }

            // 해당 DM 방과 연관된 메시지들을 조회
            const messages = await Message.findAll({
                where: { d_seq: d_seq },
            });

            // 메시지의 is_read를 0에서 1로 변경
            await Message.update(
                { is_read: 1 }, // is_read를 1로 변경
                { where: { d_seq: d_seq, u_seq: { [Op.ne]: u_seq } } } // 자신이 보낸 메시지를 제외한 메시지만 업데이트
            );

            // 모든 메시지가 읽혔는지 확인하고 unreadcnt를 조정
            const unreadMessagesCount = await Message.count({
                where: {
                    d_seq: d_seq,
                    is_read: 0, // 아직 읽지 않은 메시지만 카운트
                    u_seq: { [Op.ne]: u_seq }, // 자신이 보낸 메시지를 제외
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
        } else {
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// dm방 생성
exports.postDM = async (req, res) => {
    const { d_seq, firstUser, secondUser } = req.body; // firstUser와 secondUser를 추가로 받아옴
    try {
        const newDM = await DM.create({
            d_seq: d_seq,
            // client에서 dm신청자 firstUser, 받는사람 secondUser로 받아오기
            u_seq: firstUser, // 첫 번째 사용자의 u_seq 저장
            f_seq: secondUser, // 두 번째 사용자의 u_seq 저장
        });
        res.send(newDM);
    } catch (err) {
        console.error(error);
        res.status(500).send("server error");
    }
};

// dm방 삭제
exports.deleteDM = async (req, res) => {
    const { d_seq } = req.params; // 요청 URL에서 d_seq를 추출

    try {
        const deletedDM = await DM.destroy({
            where: {
                d_seq: d_seq, // 해당 d_seq를 가진 DM을 삭제
            },
        });
        if (deletedDM) {
            res.send(true); // 삭제 성공 시 true를 클라이언트에게 응답으로 보냄
        } else {
            res.send(false); // 삭제된 항목이 없으면 false를 클라이언트에게 응답으로 보냄
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
