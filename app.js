import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import pool from "./db.js";
import cron from "node-cron";
import gqldate from "graphql-iso-date";

const { GraphQLDateTime } = gqldate;
const port = 3000;

const typeDefs = `

  scalar DateTime

  type Session{
    id: ID!,
    title: String!,
    date: DateTime!,
    status: String!,
    type: String!,
    handler: Member!,
    notes: String!,
    attendees: [Member]
  }

  type Member{
    id: ID!,
    name: String!,
    first_name: String!,
    last_name: String!,
    join_date: DateTime!,
    status: String!,
    membership_expire: DateTime!,
    attended: [Session]
  }

  type Query {
    sessions: [Session],
    members: [Member]
  }

`;
const resolvers = {
  Session: {
    async attendees(session) {
      try {
        if (session.attendees) {
          const sessionMembers = await pool.query(
            `SELECT * FROM members WHERE id IN (${session.attendees.join(",")})`
          );

          return sessionMembers.rows;
        }
      } catch (error) {}
    },
    async handler(session) {
      try {
        if (session.handler) {
          const sessionHandler = await pool.query(
            `SELECT * FROM members WHERE id = ${session.handler}`
          );
          console.log(sessionHandler.rows[0]);
          return sessionHandler.rows[0];
        }
      } catch (error) {}
    },
  },
  Member: {
    async attended(member) {
      try {
        if (member.sessions) {
          const memberSessions = await pool.query(
            `SELECT * FROM sessions WHERE id IN (${member.sessions.join(",")})`
          );
          return memberSessions.rows;
        }
      } catch (error) {}
    },
  },
  Query: {
    sessions: async () => {
      try {
        const result = await pool.query(
          "SELECT * FROM sessions ORDER BY date ASC"
        );
        return result.rows;
      } catch (error) {}
    },
    members: async () => {
      try {
        const result = await pool.query("SELECT * FROM members");
        return result.rows;
      } catch (error) {}
    },
  },
  DateTime: GraphQLDateTime,
};

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  cors(),
  bodyParser.json(),
  bodyParser.urlencoded({
    extended: true,
  }),
  expressMiddleware(server)
);

// app.use(cors());
// app.use(bodyParser.json());
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );

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
