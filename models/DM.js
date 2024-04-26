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
            // last_id: {
            //     type: DataTypes.INTEGER,
            //     allowNull: false,
            // },
            unreadcnt: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaltValue: 0,
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
