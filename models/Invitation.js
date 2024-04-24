const Invitation = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "Invitation",
        {
            i_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            f_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            u_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            g_seq: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            i_type: {
                type: DataTypes.BOOLEAN, // 0: 친구초대, 1: 게임초대
                allowNull: false,
            },
        },
        {
            tableName: "invitation",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = Invitation;
