const Friend = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "Friend",
        {
            f_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
        },
        {
            tableName: "friend",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = Friend;
