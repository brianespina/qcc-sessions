const express = require("express");
const bodyParser = require("body-parser");
const pool = require("./db");
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  pool.query("SELECT * FROM sessions", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.listen(port, () => {
  console.log(`listening on port ${3000}`);
});
