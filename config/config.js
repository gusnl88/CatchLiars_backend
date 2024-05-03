require("dotenv").config();

const development = {
    username: process.env.DB_LOCAL_USERNAME,
    password: process.env.DB_LOCAL_PASSWORD,
    database: process.env.DB_LOCAL_DATABASE,
    host: "127.0.0.1",
    dialect: "mysql",
};
const production = {
    username: process.env.DB_LOCAL_USERNAME,
    password: process.env.DB_LOCAL_PASSWORD,
    database: process.env.DB_LOCAL_DATABASE,
    host: "127.0.0.1",
    dialect: "mysql",
};
module.exports = { development,production };
