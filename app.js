const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const { sequelize } = require("./models");
const userRouter = require("./routes/user");
const gameRouter = require("./routes/game");
const dmRouter = require("./routes/dm");
const alarmRouter = require("./routes/alarm");
const friendRouter = require("./routes/friend");
const invitationRouter = require("./routes/invitation");
const serverPrefix = "/";
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { User } = require("./models");
const LocalStrategy = require("passport-local").Strategy; // 로그인 진행 방식
const socketHandler = require("./sockets");
const bcrypt = require("bcrypt");

// session middleware
app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60,
            secure: false,
        },
    })
);

// passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());
app.use(
    cors({
        origin: true, // 클라이언트의 주소
        credentials: true, // 쿠키 허용
    })
);

// body-parser 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/uploads", express.static(__dirname + "/uploads"));

passport.use(
    // 로그인 검증
    new LocalStrategy(
        { usernameField: "inputId", passwordField: "inputPw" },
        async (inputId, inputPw, cb) => {
            try {
                const user = await User.findOne({
                    where: {
                        id: inputId,
                    },
                });

                if (!user) {
                    return cb(null, false, {
                        message:
                            "입력하신 아이디는 존재하지 않는 아이디입니다. id를 다시 확인해주세요",
                    });
                }

                const isCorrect = await bcrypt.compare(inputPw, user.pw);
                if (!isCorrect) {
                    return cb(null, false, { message: "비밀번호가 일치하지 않습니다." });
                }

                return cb(null, user);
            } catch (err) {
                return cb(err);
            }
        }
    )
);

// 로그인 성공시, 유저 정보를 session에 저장
passport.serializeUser((user, cb) => {
    cb(null, user.id); // 로그인 성공시 deserializeUser에 user.id 전송
});

// 매요청시 실행
passport.deserializeUser(async (id, cb) => {
    console.log("deserializeUser", id);
    try {
        const user = await User.findOne({
            where: {
                id: id,
            },
        });
        if (user) cb(null, user);
    } catch (err) {
        console.log(err);
        cb(err);
    }
});

// 세션 만료 확인 미들웨어
app.use(async (req, res, next) => {
    if (req.isAuthenticated() && req.session.user) {
        if (req.session.cookie.expires < new Date()) {
            const u_seq = req.user.dataValues.u_seq;
            req.session.destroy();
            req.logout();
            try {
                await User.update(
                    {
                        connect: 0,
                    },
                    {
                        where: { u_seq: u_seq },
                    }
                );
                return res.send(true);
            } catch {
                return res.status(500).send("server error");
            }
        }
    }
    next();
});

// route 설정
app.use(serverPrefix + "users", userRouter);
app.use(serverPrefix + "games", gameRouter);
app.use(serverPrefix + "friends", friendRouter);
app.use(serverPrefix + "invites", invitationRouter);
app.use(serverPrefix + "dms", dmRouter);
app.use(serverPrefix + "alarms", alarmRouter);

// sequelize를 통해 데이터베이스 연결
sequelize
    .sync({ force: false })
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
        socketHandler(server);
    })
    .catch((err) => {
        console.log(err);
    });
