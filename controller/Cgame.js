const { Game } = require("../models");

// 게임방 생성
// post /games
exports.postGame = async (req, res) => {
    const { title, pw, type } = req.body;
    try {
        await Game.create({
            g_seq: null,
            g_title: title,
            g_pw: pw,
            g_type: type,
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
// patch /games/:g_seq
exports.patchGame = async (req, res) => {
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
