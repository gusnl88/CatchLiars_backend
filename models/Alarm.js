const Alarm = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "Alarm",
        {
            a_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            u_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "Alarm",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = Alarm;
