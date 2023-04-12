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
    attendees: SessionMembers
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

export default typeDefs;
