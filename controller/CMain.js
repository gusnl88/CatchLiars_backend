// test용 api
exports.getIndex = (req, res) => {
    res.send("response from api server [GET /]");
};

exports.getProfile = async (req, res) => {
    try {
        if (req.session.id) {
            const userData = await model.User.findOne({
                where: { u_seq: req.session.data.u_seq },
            });
            return res.render("myPage", { isLogin: true, data: userData });
        } else {
            return res.render("myPage", { isLogin: false });
        }
    } catch (error) {
        console.error("프로필 조회 실패", error);
        return res.status(500).send("프로필 조회 실패");
    }
};
exports.postProfile = (req, res) => {
    model.User.findOne({
        where: {
            id: req.session.id,
        },
    })
        .then((result) => {
            if (!result) {
                return res.status(404).send("사용자 정보를 찾을 수 없습니다.");
            }
            // console.log("프로필페이지", result);
            res.render("profileEdit", { data: result });
        })
        .catch(() => {
            //console.log("프로필 조회 실패");
            res.send(500).send("프로필 조회 실패");
        });
};
exports.editUser = async (req, res) => {
    try {
        const loggedInUserID = req.session.id;
        const userIDFromClient = req.body.id;
        if (loggedInUserID !== userIDFromClient) {
            return res.status(403).send("권한이 없습니다.");
        }

        const updatedUser = {
            pw: hashPW(req.body.pw),
            nickname: req.body.nickname,
            email: req.body.email,
            image: req.file ? req.file.path : null, // 파일이 있으면 경로 저장, 없으면 null
        };

        await model.User.update(updatedUser, { where: { id: loggedInUserID } });
        req.session.data.image = updatedUser.image;
        return res.redirect("/myPage");
    } catch (error) {
        console.error("프로필 정보 업데이트 실패", error);
        return res.status(500).send("프로필 정보 업데이트 실패");
    }
};

exports.uploadProfile = (req, res) => {
    console.log(req.file); // 파일 정보
    console.log(req.body); // 텍스트 정보
    res.send("파일 업로드 완료");
};
