import dotenv from "dotenv";
dotenv.config();

export default {
  id: process.env?.DEV_USER_ID || "RESITDC",
  role: process.env?.DEV_USER_ROLE || "GOD"
};