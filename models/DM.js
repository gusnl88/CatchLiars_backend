const DM = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "DM",
        {
            d_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            f_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            last_seq: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            unreadcnt: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "DM",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = DM;
