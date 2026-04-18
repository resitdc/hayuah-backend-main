import Knex from "knex";
import { types } from "pg";
import knexConfig from "../../knexfile";

types.setTypeParser(1114, (stringValue) => stringValue);
types.setTypeParser(1184, (stringValue) => stringValue);

const db = Knex(knexConfig);

export default db;
