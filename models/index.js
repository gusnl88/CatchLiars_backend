"use strict";

const Sequelize = require("sequelize");
const config = require(__dirname + "/../config/config.js")["development"];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const UserModel = require("./User")(sequelize, Sequelize);
const GameModel = require("./Game")(sequelize, Sequelize);
const FriendModel = require("./Friend")(sequelize, Sequelize);
const InvitationModel = require("./Invitation")(sequelize, Sequelize);

UserModel.hasMany(FriendModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

FriendModel.belongsTo(UserModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

UserModel.hasMany(InvitationModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

InvitationModel.belongsTo(UserModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = UserModel;
db.Game = GameModel;
db.Friend = FriendModel;
db.Invitation = InvitationModel;

module.exports = db;
