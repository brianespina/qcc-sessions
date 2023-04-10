import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pool from "./db.js";
import cron from "node-cron";

const port = 3000;

const app = express();

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
app.get("/api/v1/sessions-current", (req, res) => {
  pool.query(
    "SELECT * FROM sessions WHERE date >= now() AND status != 'archive' ORDER BY date ASC",
    (error, results) => {
      res.json(results.rows);
    }
  );
});

// GET all Sessions Current
app.get("/api/v1/attendees/:session_id", (req, res) => {
  const { session_id } = req.params;
  pool.query(
    `SELECT members.first_name FROM session_attendees 
    LEFT JOIN members ON session_attendees.member_id = members.id 
    WHERE session_id = ${session_id}`,
    (error, results) => {
      res.json(results.rows);
    }
  );
});

// GET all Sessions Current
app.get("/api/v1/sessions-archive", (req, res) => {
  pool.query(
    "SELECT * FROM sessions WHERE status = 'archive' ORDER BY date ASC",
    (error, results) => {
      res.json(results.rows);
    }
  );
});

//POST add session
app.post("/api/v1/sessions", (req, res) => {
  const { title, date, status, type, handler, notes } = req.body;

  pool.query(
    "INSERT INTO sessions (title, date, status, type, handler, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [title, date, status, type, handler, notes],
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
  const { title, date, status, type, handler, notes } = req.body;
  pool.query(
    `UPDATE sessions SET title=$1, date=$2, status=$3, type=$4, handler=$5, notes=$6 WHERE id=${id} RETURNING *`,
    [title, date, status, type, handler, notes],
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

//Expire  Session
function expireSessions() {
  pool.query(`UPDATE sessions SET status='archive' WHERE date < now()`);
}

//CRON Schedules

//Expire Session

cron.schedule("* * * * *", () => {
  expireSessions();
  console.log("expired sessions");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
