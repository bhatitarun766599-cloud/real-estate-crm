const { Pool } = require("pg");

const pool = new Pool({
 user: "manibhati",
 host: "localhost",
 database: "crm",
 password: "",
 port: 5432,
});

module.exports = pool;