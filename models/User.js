const User = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "User",
        {
            u_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            id: {
                type: DataTypes.STRING(30),
                allowNull: false,
            },
            pw: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            nickname: {
                type: DataTypes.STRING(30),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            score: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            connect: {
                type: DataTypes.BOOLEAN, // 0: 접속 x, 1: 접속 o
                allowNull: false,
                defaultValue: 0,
            },
            image: {
                type: DataTypes.STRING(250),
                allowNull: true,
            },
        },
        {
            tableName: "user",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = User;
