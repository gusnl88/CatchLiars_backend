const { Friend } = require("../models");

// 친구 생성하기
exports.postFriend = async (req, res) => {
    const { u_seq } = req.body; // 친구의 u_seq

    const user = req.session.passport; // 현재 유저 확인
    console.log("===현재 유저의 정보::", req.session.passport.user.userInfo);
    if (user) {
        // 로그인된 사용자가 있을 경우
        await Friend.create({});
    } else {
        return res.send("로그인이 필요합니다.");
    }
    // 이미 친구가 맺어진 상태인지 확인
    res.end();
};
