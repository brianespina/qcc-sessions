CREATE DATABASE qcc_sessions;

CREATE TABLE sessions(
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    status VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    handler INT NOT NULL,
    notes VARCHAR(500)
);

ALTER TABLE sessions ADD FOREIGN KEY (attendees) REFERENCES session_attendees(id)

CREATE TABLE session_attendees(
    session_id INT REFERENCES sessions(id) ON UPDATE CASCADE,   
    member_id INT REFERENCES members(id) ON UPDATE CASCADE,
    CONSTRAINT session_member_pkey PRIMARY KEY (session_id, member_id)
);

CREATE TABLE members(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    join_date TIMESTAMP NOT NULL,
    status VARCHAR(255) NOT NULL,
    membership_expire TIMESTAMP NOT NULL
);

CREATE TABLE users(
    id SERIAL PRIMARY KEY ,
    uname VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
);


SELECT * FROM sessions;

SELECT members.first_name
FROM session_attendees
LEFT JOIN members 
ON session_attendees.member_id = members.id
WHERE session_id = 88;

INSERT INTO session_attendees (session_id, member_id) 
VALUES (88, 1),(88, 2),(88, 3);

INSERT INTO members (name, first_name, last_name, join_date, status, membership_expire) 
VALUES ('Brian Espina', 'Brian', 'Espina', '2022-11-11 13:23:44', 'monthly', '2023-11-11 13:23:44') RETURNING *;

INSERT INTO members (name, first_name, last_name, join_date, status, membership_expire) 
VALUES ('JR Jimenez', 'JR', 'Jimenez', '2022-11-11 13:23:44', 'monthly', '2023-11-11 13:23:44') RETURNING *;

INSERT INTO members (name, first_name, last_name, join_date, status, membership_expire) 
VALUES ('Kian Angay', 'Kian', 'Angay', '2022-11-11 13:23:44', 'monthly', '2023-11-11 13:23:44') RETURNING *;


INSERT INTO session_attendees (member_id, session_id) 
VALUES (1, 88) RETURNING *;

