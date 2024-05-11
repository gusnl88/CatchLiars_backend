const { Op } = require("sequelize");
const { Game } = require("../models");

// 게임방 생성
exports.postGame = async (req, res) => {
    const { title, pw, type } = req.body;
    try {
        if (req.session.user.u_seq) {
            const gameInfo = await Game.create({
                g_seq: null,
                g_title: title,
                g_pw: pw,
                g_type: type,
            });
            return res.send(gameInfo);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 게임방 전체 목록 조회
exports.getGame = async (req, res) => {
    const { type } = req.params; // 0: 캐치 라이어 1: 마피아
    try {
        const gameList = await Game.findAll({
            where: {
                g_type: type,
            },
            order: [["g_seq", "DESC"]],
        });
        return res.send(gameList);
    } catch {
        return res.status(500).send("server error");
    }
};

// 게임방 검색
exports.getSearch = async (req, res) => {
    try {
        const { keyword } = req.query;
        const { type } = req.params; // 0: 캐치라이어, 1: 마피아

        const searchList = await Game.findAll({
            where: {
                g_type: type,
                g_title: { [Op.like]: `%${keyword}%` },
            },
            order: [["g_seq", "DESC"]],
        });
        return res.send(searchList);
    } catch {
        return res.status(500).send("server error");
    }
};

// 게임방 설정 변경
exports.patchGameSetting = async (req, res) => {
    const { g_seq } = req.params;
    const { title, pw } = req.body;

    try {
        if (req.session.user.u_seq) {
            await Game.update(
                {
                    g_title: title,
                    g_pw: pw,
                },
                {
                    where: { g_seq },
                }
            );
            return res.send(true);
        }
    } catch {
        return res.status(401).send("로그인이 필요합니다");
    }
};

// 게임방 인원 증가
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
                return res.send(true);
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
                return res.send(true);
            }
        }
    } catch {
        return res.status(500).send("server error");
    }
};

// 게임방 인원 감소
exports.patchMinus = async (req, res) => {
    const { g_seq } = req.params;
    try {
        const gameInfo = await Game.findOne({
            where: { g_seq },
        });
        const new_total = gameInfo.g_total - 1;

        if (new_total <= 0) {
            const game = await Game.destroy({
                where: {
                    g_seq,
                },
            });
            if (game) return res.send(true);
            else return res.send(false);
        } else {
            await Game.update(
                {
                    g_total: new_total,
                },
                {
                    where: { g_seq },
                }
            );
            return res.send(true);
        }
    } catch {
        return res.status(500).send("server error");
    }
};

// 게임방 상태 변경
exports.patchGameState = async (req, res) => {
    const { g_seq } = req.params;
    const { type } = req.body;

    if (type === "start") {
        // 게임중
        await Game.update(
            {
                g_state: 0,
            },
            {
                where: { g_seq },
            }
        );
        return res.send(true);
    } else {
        await Game.update(
            {
                g_state: 1,
            },
            {
                where: { g_seq },
            }
        );
        return res.send(true);
    }
};
