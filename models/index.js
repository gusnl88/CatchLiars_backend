"use strict";

const Sequelize = require("sequelize");
const config = require(__dirname + "/../config/config.js")["development"];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const UserModel = require("./User")(sequelize, Sequelize);
const GameModel = require("./Game")(sequelize, Sequelize);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = UserModel;
db.Game = GameModel;

module.exports = db;
