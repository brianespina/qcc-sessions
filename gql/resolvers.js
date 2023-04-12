import gqldate from "graphql-iso-date";
import pool from "../db.js";
const { GraphQLDateTime } = gqldate;

const resolvers = {
  Session: {
    async attendees(session) {
      try {
        if (session.attendees) {
          const sessionMembers = await pool.query(
            `SELECT * FROM session_attendees WHERE session = ${session.id}`
          );
          return sessionMembers.rows[0];
        }
      } catch (error) {}
    },
    async handler(session) {
      try {
        if (session.handler) {
          const sessionHandler = await pool.query(
            `SELECT * FROM members WHERE id = ${session.handler}`
          );
          return sessionHandler.rows[0];
        }
      } catch (error) {}
    },
  },

  SessionMembers: {
    async members(item) {
      const membersResult = await pool.query(`
          SELECT * FROM members WHERE id IN (${item.members.join(",")})
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

export default resolvers;
