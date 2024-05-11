const { Alarm, Message } = require("../models");
const passport = require("passport");

// DM 알림 목록
exports.getAlarm = async (req, res) => {
    try {
        if (req.session.user.u_seq) {
            const alarms = await Alarm.findAll({
                where: {
                    u_seq: req.session.user.u_seq,
                },
            });
            return res.send(alarms);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 알림 삭제
exports.deleteAlarm = async (req, res) => {
    const { a_seq } = req.body;

    try {
        const deleteAlarm = await Alarm.destroy({
            where: {
                a_seq: a_seq,
            },
        });
        if (deleteAlarm) {
            return res.send(true);
        } else {
            return res.send(false);
        }
    } catch {
        return res.status(500).send("Server Error");
    }
};
