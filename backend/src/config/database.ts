import pg from "pg";
import { env } from "#src/config/env";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.SUPABASE_URL,
  max: 10, // max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// optional: test connection on startup
pool.on("connect", () => {
  console.log("Connected to Postgres");
});

pool.on("error", (err) => {
  console.error("Postgres pool error", err);
  process.exit(1);
});
const connectionString = env.SUPABASE_CONNECTION_STRING;

export const connection = new pg.Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false },
});

connection.on("error", (err) => {
  console.log(err);
});

function initDatabase() {
  connection
    .connect()
    .then(() => {
      return connection.query("SELECT 1");
    })
    .then(() => {
      console.log("Successfully Connected to the Supabase");
    })
    .catch((err) => {
      console.error("Connection Error :", err.stack);
    });
}

export default {
  connection,
  initDatabase,
};
