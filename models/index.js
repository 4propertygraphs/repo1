const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, { logging: false });

const User = sequelize.define('users', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING, // Updated field
    token: DataTypes.STRING,
}, {
    timestamps: false, // Disable createdAt and updatedAt
    freezeTableName: true,

});

const Agency = sequelize.define('agencies', {
    name: DataTypes.STRING,
    address1: DataTypes.STRING,
    address2: DataTypes.STRING,
    logo: DataTypes.STRING,
    site_name: DataTypes.STRING,
    site: DataTypes.STRING, // Added site field
    acquaint_site_prefix: DataTypes.STRING, // Added field
    myhome_api_key: DataTypes.STRING, // Added field
    myhome_group_id: DataTypes.INTEGER, // Adjusted type
    daft_api_key: DataTypes.STRING, // Added field
    fourpm_branch_id: DataTypes.INTEGER, // Adjusted type
    unique_key: DataTypes.STRING,
    office_name: DataTypes.STRING,
    ghl_id: DataTypes.STRING,
    whmcs_id: DataTypes.STRING,
    primary_source: DataTypes.STRING,
    total_properties: DataTypes.INTEGER // <-- Add this line
}, {
    timestamps: false, // Disable createdAt and updatedAt
    freezeTableName: true,

});



module.exports = { sequelize, User, Agency };
