const { Alarm, Message } = require("../models");
const passport = require("passport");

// 알람목록 & 알람이 뜰 id를 가져오기
exports.getAlarmList = async (req, res) => {
    try {
        if (req.session.u_seq) {
            // 해당 사용자의 알람 목록 조회
            const alarms = await Alarm.findAll({
                where: {
                    a_seq: req.session.u_seq, // 현재 사용자의 u_seq와 일치하는 알람들을 조회
                },
            });

            // 아직 확인하지 않은 알람의 수 계산
            const unreadCount = alarms.filter((alarm) => !alarm.checked).length;

            // 알람 목록 및 확인하지 않은 알람의 수 응답
            res.json({ alarms, unreadCount });
        } else {
            // 세션 정보가 없을 경우(로그인되지 않은 경우)에 대한 예외 처리
            res.status(401).send("Unauthorized");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// 전체 알람 삭제 -> 프론트에서 하나 or 전체 삭제 나누기
exports.deleteAlarm = async (req, res) => {
    const { a_seq } = req.params; // 요청 URL에서 a_seq를 추출

    try {
        const deletedAlarm = await Alarm.destroy({
            where: {
                a_seq: a_seq, // 해당 a_seq를 가진 Alarm을 삭제
            },
        });
        if (deletedAlarm) {
            res.send(true); // 삭제 성공 시 true를 클라이언트에게 응답으로 보냄
        } else {
            res.send(false); // 삭제된 항목이 없으면 false를 클라이언트에게 응답으로 보냄
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};