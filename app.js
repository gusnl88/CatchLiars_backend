const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT;
const { sequelize } = require("./models");
const indexRouter = require("./routes");
const userRouter = require("./routes/user");
const serverPrefix = "/";
// body-parser 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/uploads", express.static(__dirname + "/uploads"));

// route 설정
app.use(serverPrefix, indexRouter); // index.js
app.use(serverPrefix + "users", userRouter);

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
