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

  type Session {
    id: ID!
    title: String!
    date: DateTime!
    status: String!
    type: String!
    handler: Member
    notes: String!
    attendees: [SessionMembers]
  }

  type SessionMembers {
    session: Session
    members: [Member]
  }

  type Member {
    id: ID!
    name: String!
    first_name: String!
    last_name: String!
    join_date: DateTime!
    status: String!
    membership_expire: DateTime!
    attended: [SessionMembers]
  }

  type Query {
    sessions(status: String): [Session]
    session(id: ID!): Session
    members: [Member]
    session_members: [SessionMembers]
  }

  input SessionInput{
    id: ID!
    title: String!
    date: String!
    status: String!
    type: String!
    handler: Int
    notes: String!
    attendees: [Int]
  }

  type Mutation {
    deleteSession(id: ID!): Boolean
    updateSession(session: SessionInput!): Boolean
  }
`;
const resolvers = {
  Session: {
    async attendees(session) {
      try {
        if (session.attendees) {
          const sessionMembers = await pool.query(
            `SELECT * FROM session_attendees WHERE session = ${session.id}`
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
  SessionMembers: {
    async members(session_member) {
      const membersResult = await pool.query(`
          SELECT * FROM members WHERE id IN (${session_member.members.join(
            ","
          )})
        `);
      return membersResult.rows;
    },
    async session(session_member) {
      const session = await pool.query(`
        SELECT * FROM sessions WHERE id = ${session_member}
      `);
      console.log(session);
      return session.rows[0];
    },
  },
  Member: {
    async attended(member) {
      try {
        const memberSessions = await pool.query(
          `SELECT session FROM session_attendees WHERE ${member.id} = ANY(members)`
        );
        return memberSessions.rows.map((session) => session.session);
      } catch (error) {}
    },
  },
  Query: {
    sessions: async (parent, args, contextValue, info) => {
      const { status } = args;

      try {
        const result = await pool.query(
          `SELECT * FROM sessions ORDER BY date ASC`
        );

        if (!status || status === "all") {
          return result.rows;
        }

        return result.rows.filter((session) => session.status === status);
      } catch (error) {}
    },
    session: async (parent, args) => {
      const { id } = args;
      try {
        const result = await pool.query(
          `SELECT * FROM sessions WHERE id = ${id}`
        );
        return result.rows[0];
      } catch (error) {}
    },
    members: async () => {
      try {
        const result = await pool.query("SELECT * FROM members");
        return result.rows;
      } catch (error) {}
    },
  },
  Mutation: {
    deleteSession: async (parent, args) => {
      const { id } = args;
      const deletedSession = await pool.query(
        `DELETE FROM sessions WHERE id = ${id}`
      );
    },

    updateSession: async (parent, args) => {
      const { session } = args;

      const updateSession = await pool.query(
        `UPDATE sessions SET title='${
          session.title
        }', attendees=ARRAY[${session.attendees.join(",")}], date='${
          session.date
        }', status='${session.status}', type='${session.type}', handler=${
          session.handler
        }, notes='${session.notes}' WHERE id='${session.id}'`
      );
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
  cors({
    origin: ["http://localhost:5173"],
  })
);
app.use(
  "/graphql",
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
// app.get("/api/v1/sessions", (req, res) => {
//   pool.query("SELECT * FROM sessions ORDER BY date ASC", (error, results) => {
//     res.json(results.rows);
//   });
// });

// // GET all Sessions Current
// app.get("/api/v1/sessions-current", (req, res) => {
//   pool.query(
//     "SELECT * FROM sessions WHERE date >= now() AND status != 'archive' ORDER BY date ASC",
//     (error, results) => {
//       res.json(results.rows);
//     }
//   );
// });

// // GET all Sessions Current
// app.get("/api/v1/attendees/:session_id", (req, res) => {
//   const { session_id } = req.params;
//   pool.query(
//     `SELECT members.first_name FROM session_attendees
//     LEFT JOIN members ON session_attendees.member_id = members.id
//     WHERE session_id = ${session_id}`,
//     (error, results) => {
//       res.json(results.rows);
//     }
//   );
// });

// // GET all Sessions Current
// app.get("/api/v1/sessions-archive", (req, res) => {
//   pool.query(
//     "SELECT * FROM sessions WHERE status = 'archive' ORDER BY date ASC",
//     (error, results) => {
//       res.json(results.rows);
//     }
//   );
// });

// //POST add session
// app.post("/api/v1/sessions", (req, res) => {
//   const { title, date, status, type, handler, notes } = req.body;

//   pool.query(
//     "INSERT INTO sessions (title, date, status, type, handler, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//     [title, date, status, type, handler, notes],
//     (error, results) => {
//       if (error) {
//         throw error;
//       }
//       res.json(results.rows);
//     }
//   );
// });

// //DELETE Session by Id

// app.delete("/api/v1/sessions/:id", (req, res) => {
//   const { id } = req.params;
//   pool.query(`DELETE FROM sessions WHERE id = '${id}'`, (error, results) => {
//     if (error) {
//       throw error;
//     }

//     res.json("Session deleted");
//   });
// });

// //Edit  Session
// app.put("/api/v1/sessions/:id", (req, res) => {
//   const { id } = req.params;
//   const { title, date, status, type, handler, notes } = req.body;
//   pool.query(
//     `UPDATE sessions SET title=$1, date=$2, status=$3, type=$4, handler=$5, notes=$6 WHERE id=${id} RETURNING *`,
//     [title, date, status, type, handler, notes],
//     (error, results) => {
//       if (error) {
//         throw error;
//       }
//       res.json(results.rows);
//     }
//   );
// });

// //Get single session
// app.get("/api/v1/sessions/:id", (req, res) => {
//   const { id } = req.params;
//   pool.query(`SELECT * FROM sessions WHERE id=${id}`, (error, results) => {
//     if (error) {
//       throw error;
//     }
//     res.json(results.rows);
//   });
// });

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
