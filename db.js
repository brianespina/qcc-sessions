const Pool = require("pg").Pool;
const pool = new Pool({
  user: "postgres",
  password: "braintank11",
  host: "localhost",
  post: 5432,
  database: "qcc_sessions",
});

module.exports = pool;
