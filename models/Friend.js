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
            c_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
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
