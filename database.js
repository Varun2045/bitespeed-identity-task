const { Sequelize } = require('sequelize');

// Replace 'YOUR_PASSWORD_HERE' with your real Postgres password
const sequelize = new Sequelize('bitespeed_db', 'postgres', 'varun', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // This keeps the terminal clean
});

module.exports = sequelize;