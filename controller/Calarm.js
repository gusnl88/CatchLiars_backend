const { Alarm, Message } = require("../models");
const passport = require("passport");

// 알람목록 & 알람이 뜰 id를 가져오기
exports.getAlarm = async (req, res) => {
    try {
        if (req.session.user.u_seq) {
            // 해당 사용자의 알람 목록 조회
            const alarms = await Alarm.findAll({
                where: {
                    u_seq: req.session.user.u_seq, // 현재 사용자의 u_seq와 일치하는 알람들을 조회
                },
            });
            return res.send(alarms);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 전체 알람 삭제 -> 프론트에서 하나 or 전체 삭제 나누기
exports.deleteAlarm = async (req, res) => {
    const { a_seq } = req.body;

    try {
        const deleteAlarm = await Alarm.destroy({
            where: {
                a_seq: a_seq, // 해당 a_seq를 가진 알람 삭제
            },
        });
        if (deleteAlarm) {
            res.send(true); // 삭제 성공 시 true를 클라이언트에게 응답으로 보냄
        } else {
            res.send(false); // 삭제된 항목이 없으면 false를 클라이언트에게 응답으로 보냄
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
