const { where } = require("sequelize");
const { Game } = require("../models");

// 게임방 생성
// post /games
exports.postGame = async (req, res) => {
    const { title, pw, type } = req.body;
    var state = 1;
    if (pw) {
        // 비밀번호가 있을 경우, 진입 불가
        state = 0;
    }
    try {
        await Game.create({
            g_seq: null,
            g_title: title,
            g_pw: pw,
            g_type: type,
            g_total: 1,
            g_state: state,
        });
        res.send(true);
    } catch {
        res.status(500).send("server error");
    }
};

// 게임방 전체 목록 조회
// get /games/:type
exports.getGame = async (req, res) => {
    const { type } = req.params; // 0: 캐치 라이어 1: 마피아
    try {
        const gameList = await Game.findAll({
            where: {
                g_type: type,
            },
            order: [["g_seq", "DESC"]],
        });
        res.send(gameList);
    } catch {
        res.status(500).send("server error");
    }
};

// 게임방 설정 변경
// patch /games/setting/:g_seq
exports.patchGameSetting = async (req, res) => {
    const { g_seq } = req.params;
    const { title, pw } = req.body;

    try {
        await Game.update(
            {
                g_title: title,
                g_pw: pw,
            },
            {
                where: { g_seq },
            }
        );
        res.send(true);
    } catch {
        res.status(500).send("server error");
    }
};

// 게임방 인원 증가
// patch /games/plus/:g_seq
exports.patchPlus = async (req, res) => {
    const { g_seq } = req.params;
    try {
        const gameInfo = await Game.findOne({
            where: { g_seq },
        });
        const new_total = gameInfo.g_total + 1;

        if (gameInfo.g_type) {
            // 마피아
            if (new_total > 8) res.send("인원이 초과되어 입장이 불가능합니다.");
            else {
                await Game.update(
                    {
                        g_total: new_total,
                    },
                    {
                        where: { g_seq },
                    }
                );
                res.send(true);
            }
        } else {
            // 캐치 라이어
            if (new_total > 6) res.send("인원이 초과되어 입장이 불가능합니다.");
            else {
                await Game.update(
                    {
                        g_total: new_total,
                    },
                    {
                        where: { g_seq },
                    }
                );
                res.send(true);
            }
        }
    } catch {
        res.status(500).send("server error");
    }
};

// 게임방 인원 감소
// patch /games/minus/:g_seq
exports.patchMinus = async (req, res) => {
    const { g_seq } = req.params;
    try {
        const gameInfo = await Game.findOne({
            where: { g_seq },
        });
        const new_total = gameInfo.g_total - 1;

        if (new_total <= 0) {
            res.send(false);
        } else {
            await Game.update(
                {
                    g_total: new_total,
                },
                {
                    where: { g_seq },
                }
            );
            res.send(true);
        }
    } catch {
        res.status(500).send("server error");
    }
};

// 게임방 삭제
exports.deleteGame = async (req, res) => {
    const { g_seq } = req.params;
    try {
        const game = await Game.destroy({
            where: {
                g_seq,
            },
        });
        if (game) res.send(true);
        else res.send(false);
    } catch {
        res.status(500).send("server error");
    }
};
