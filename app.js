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

// GET all Sessions
app.get("/api/v1/sessions", (req, res) => {
  pool.query("SELECT * FROM sessions ORDER BY date", (error, results) => {
    res.json(results.rows);
  });
});

//POST add session
app.post("/api/v1/sessions", (req, res) => {
  const { title, date, attendees, status, type, handler, notes } = req.body;
  pool.query(
    "INSERT INTO sessions (title, date, attendees, status, type, handler, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [title, date, JSON.stringify(attendees), status, type, handler, notes],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.json(results.rows);
    }
  );
});

app.listen(port, () => {
  console.log(`listening on port ${3000}`);
});
