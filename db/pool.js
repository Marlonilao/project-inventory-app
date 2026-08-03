require('dotenv').config();

const { Pool } = require('pg');

console.log('DATABASE_URL: ', process.env.DATABASE_URL);

module.exports = new Pool({
  connectionString: process.env.DATABASE_URL,
});
