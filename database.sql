CREATE DATABASE qcc_sessions;

CREATE TABLE sessions(
    id INT PRIMARY KEY NOT NULL ,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    attendees JSON,
    status VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    handler INT NOT NULL,
    notes VARCHAR(500)
);

