import jwt from "jsonwebtoken";
import { AccessTokenPayload } from "@dataTypes/general";

export const signAccessToken = (payload: object) => 
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { 
    expiresIn: "1m", // should be 10 mins
    issuer: "en-auth",
    audience: "en-client"
  });

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
    issuer: "en-auth",
    audience: "en-client"
  });

export const isAccessTokenPayload = (p: any): p is AccessTokenPayload => {
  return (
    typeof p === "object" &&
    typeof p.sub === "string" &&
    typeof p.role === "string" &&
    typeof p.jti === "string" &&
    typeof p.iss === "string" &&
    typeof p.aud === "string" &&
    typeof p.iat === "number" &&
    typeof p.exp === "number"
  );
};