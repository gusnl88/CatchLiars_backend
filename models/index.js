"use strict";

const Sequelize = require("sequelize");
let config;
if (process.env.NODE_ENV) {
    config = require(__dirname + "/../config/config.js")[process.env.NODE_ENV];
} else {
    config = require(__dirname + "/../config/config.js")["development"];
}
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const UserModel = require("./User")(sequelize, Sequelize);
const GameModel = require("./Game")(sequelize, Sequelize);
const DmModel = require("./DM")(sequelize, Sequelize);
const MessageModel = require("./Message")(sequelize, Sequelize);
const AlarmModel = require("./Alarm")(sequelize, Sequelize);
const FriendModel = require("./Friend")(sequelize, Sequelize);
const InvitationModel = require("./Invitation")(sequelize, Sequelize);

UserModel.hasMany(DmModel, { foreignKey: "u_seq" });
DmModel.belongsTo(UserModel, { foreignKey: "u_seq" });

DmModel.hasMany(MessageModel, { foreignKey: "d_seq", onDelete: "CASCADE" });
MessageModel.belongsTo(DmModel, { foreignKey: "d_seq", onDelete: "CASCADE" });
UserModel.hasMany(MessageModel, { foreignKey: "u_seq", onDelete: "CASCADE" }); // 여기서 수정
MessageModel.belongsTo(UserModel, { foreignKey: "u_seq", onDelete: "CASCADE" }); // 여기서 수정

DmModel.hasMany(AlarmModel, { foreignKey: "d_seq", onDelete: "CASCADE" });
AlarmModel.belongsTo(DmModel, { foreignKey: "d_seq", onDelete: "CASCADE" });

UserModel.hasMany(FriendModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

FriendModel.belongsTo(UserModel, {
    target: "u_seq",
    foreignKey: "u_seq",
});

UserModel.hasMany(InvitationModel, {
    sourceKey: "u_seq",
    foreignKey: "u_seq",
});

InvitationModel.belongsTo(UserModel, {
    target: "u_seq",
    foreignKey: "u_seq",
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = UserModel;
db.Game = GameModel;

db.DM = DmModel;
db.Message = MessageModel;
db.Alarm = AlarmModel;

db.Friend = FriendModel;
db.Invitation = InvitationModel;

module.exports = db;
