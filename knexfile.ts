import { Knex } from "knex";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const knexConfig: Knex.Config = {
  client: "postgresql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  }
};

export default knexConfig;
