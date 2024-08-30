import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const dbPort: number | undefined = Number(process.env.DB_PORT);

const connectionPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
    connectTimeout: 30000,
    port: dbPort
});

export { connectionPool };