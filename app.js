const express = require("express");
const bodyParser = require("body-parser");
const pool = require("./db");
const app = express();
const cors = require("cors");
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// GET all Sessions
app.get("/api/v1/sessions", (req, res) => {
  pool.query("SELECT * FROM sessions ORDER BY date ASC", (error, results) => {
    res.json(results.rows);
  });
});

// GET all Sessions Current
app.get("/api/v1/sessions/current", (req, res) => {
  pool.query(
    "SELECT * FROM sessions where date > now() ORDER BY date ASC",
    (error, results) => {
      res.json(results.rows);
    }
  );
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

//DELETE Session by Id

app.delete("/api/v1/sessions/:id", (req, res) => {
  const { id } = req.params;
  pool.query(`DELETE FROM sessions WHERE id = '${id}'`, (error, results) => {
    if (error) {
      throw error;
    }

    res.json("Session deleted");
  });
});

//Edit  Session
app.put("/api/v1/sessions/:id", (req, res) => {
  const { id } = req.params;
  const { title, date, attendees, status, type, handler, notes } = req.body;
  pool.query(
    `UPDATE sessions SET title=$1, date=$2, attendees=$3, status=$4, type=$5, handler=$6, notes=$7 WHERE id=${id} RETURNING *`,
    [title, date, JSON.stringify(attendees), status, type, handler, notes],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.json(results.rows);
    }
  );
});

//Get single session
app.get("/api/v1/sessions/:id", (req, res) => {
  const { id } = req.params;
  pool.query(`SELECT * FROM sessions WHERE id=${id}`, (error, results) => {
    if (error) {
      throw error;
    }
    res.json(results.rows);
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
