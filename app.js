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
const dmRouter = require("./routes/dm");
// const AlarmRouter = require("./router/alarm");
const friendRouter = require("./routes/friend");
const invitationRouter = require("./routes/invitation");
const serverPrefix = "/";
const session = require("express-session");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { User, Game, DM, Message, Alarm } = require("./models");
const LocalStrategy = require("passport-local").Strategy; // 로그인 진행 방식
const socketHandler = require("./sockets");
const bcrypt = require("bcrypt");

// body-parser 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: "http://localhost:3000", // 클라이언트의 주소
        credentials: true, // 쿠키 허용
    })
);

app.use("/uploads", express.static(__dirname + "/uploads"));

// session middleware
app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60,
            httpOnly: true,
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
            const user = await User.findOne({
                where: {
                    id: inputId,
                },
            });
            if (user) {
                // 일치하는 아이디가 있는 경우에만 비밀번호 확인
                // 입력한 비밀번호와 DB에 저장된 암호화된 비밀번호를 비교
                const isCorrect = await bcrypt.compare(inputPw, user.pw);
                if (isCorrect) {
                    // 비밀번호 일치
                    const userInfo = await User.findOne({
                        where: {
                            id: inputId,
                        },
                    });
                    if (userInfo) cb(null, userInfo);
                } else {
                    cb(null, false, { message: "비밀번호가 일치하지 않습니다." });
                }
            } else {
                cb(null, false, {
                    message: "입력하신 아이디는 존재하지 않는 아이디입니다. id를 다시 확인해주세요",
                });
            }
        }
    )
);

// 로그인 성공시, 유저 정보를 session에 저장
// 초기 로그인 시에 실행
passport.serializeUser((user, cb) => {
    cb(null, user.id); // 로그인 성공시 deserializeUser에 user.id 전송
});

// session에 저장된 사용자 정보 검증
// 매 요청시에 실행
passport.deserializeUser(async (inputId, cb) => {
    try {
        const user = await User.findOne({
            where: {
                id: inputId,
            },
        });
        if (user) cb(null, user); // db에서 해당 유저를 찾아서 리턴
    } catch (err) {
        console.log(err);
    }
});

// route 설정
app.use(serverPrefix, indexRouter); // index.js
app.use(serverPrefix + "users", userRouter);
app.use(serverPrefix + "games", gameRouter);
app.use(serverPrefix + "friends", friendRouter);
app.use(serverPrefix + "invites", invitationRouter);
app.use(serverPrefix + "dms", dmRouter);

// sequelize를 통해 데이터베이스 연결
sequelize
    .sync({ force: false })
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`);
        });
        // 수정된 부분: socketHandler 호출 시 server 객체 전달
        socketHandler(server); // 여기서 socketHandler를 호출합니다.
    })
    .catch((err) => {
        console.log(err);
    });
