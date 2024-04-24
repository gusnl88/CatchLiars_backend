const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const { sequelize } = require("./models");
const indexRouter = require("./routes");
const userRouter = require("./routes/user");
const gameRouter = require("./routes/game");
const serverPrefix = "/";
const session = require("express-session");
const passport = require("passport");
const { User, Game } = require("./models");
const LocalStrategy = require("passport-local").Strategy; // 로그인 진행 방식

// body-parser 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// session middleware
app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
        },
    })
);

// passport middleware
app.use(passport.initialize());
app.use(passport.session()); // session을 이용하여 passport를 동작

passport.use(
    // 로그인 검증
    new LocalStrategy(
        { usernameField: "inputId", passwordField: "inputPw" },
        async (inputId, inputPw, cb) => {
            // cb(에러, 성공값, 실패값)
            const userId = await User.findOne({
                where: {
                    id: inputId,
                },
            });
            if (userId) {
                // 일치하는 아이디가 있는 경우에만 비밀번호 확인
                const userInfo = await User.findOne({
                    where: {
                        id: inputId,
                        pw: inputPw,
                    },
                });
                if (userInfo) cb(null, userInfo);
                else cb(null, false, { message: "비밀번호가 일치하지 않습니다." });
            } else {
                cb(null, false, {
                    message: "입력하신 아이디는 존재하지 않는 아이디입니다. id를 다시 확인해주세요",
                });
            }
        }
    )
);

// 로그인 성공시, 유저 정보를 session에 저장
passport.serializeUser((userInfo, cb) => {
    cb(null, userInfo.id);
});

// session에 저장된 사용자 정보 검증
passport.deserializeUser(async (inputId, cb) => {
    try {
        const userInfo = await User.findOne({
            where: {
                id: inputId,
            },
        });
        if (userInfo) cb(null, userInfo);
    } catch (err) {
        console.log(err);
    }
});

// route 설정
app.use(serverPrefix, indexRouter); // index.js
app.use(serverPrefix + "users", userRouter);
app.use(serverPrefix + "games", gameRouter);

sequelize
    .sync({ force: false })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log(err);
    });
