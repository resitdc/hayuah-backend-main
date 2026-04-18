import nodemailer, { Transporter } from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

let transporter: Transporter;

export const getMailer = (): Transporter => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SMTP_USER,
      clientId: process.env.G_CLIENT_ID,
      clientSecret: process.env.G_CLIENT_SECRET,
      refreshToken: process.env.G_REFRESH_TOKEN,
    },
    pool: true,
    maxConnections: 5,
  } as any);

  return transporter;
};