import dotenv from "dotenv";

dotenv.config();

const authSecret: string = process.env.JWT_ACCESS_SECRET || "SECRETSAMPLE";

export default authSecret;
