const { Sequelize } = require('sequelize');

// If the app is on the internet, it will use 'process.env.DATABASE_URL'
// If it's on your computer, it will use the local setup
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize('bitespeed_db', 'postgres', 'YOUR_LOCAL_PASSWORD', {
      host: 'localhost',
      dialect: 'postgres',
      logging: false
    });

module.exports = sequelize;