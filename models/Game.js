const Game = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "Game",
        {
            g_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            g_title: {
                type: DataTypes.STRING(20),
                allowNull: false,
            },
            g_pw: {
                type: DataTypes.STRING(20),
                allowNull: true,
            },
            g_type: {
                type: DataTypes.BOOLEAN, // 0: 캐치라이어, 1: 마피아
                allowNull: false,
            },
            g_total: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            g_state: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 1,
            },
        },
        {
            tableName: "game",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = Game;
