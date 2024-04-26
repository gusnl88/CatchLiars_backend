const Message = (Sequelize, DataTypes) => {
    return Sequelize.define(
        "Message",
        {
            m_seq: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            content: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            create_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            is_read: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            tableName: "Message",
            freezeTableName: true,
            timestamps: false,
        }
    );
};

module.exports = Message;
