import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponseOld } from "@utils/response";
import dotenv from "dotenv";
// import { revokedJtiCache } from "@cache/revokedJti.cache";
// import { userStatusCache } from "@cache/userStatus.cache";
import { user as userSchema } from "@resitdc/hayuah-models";
import knex from "@config/connection";
import { isAccessTokenPayload } from "@utils/jwt";
import { AccessTokenPayload } from "@dataTypes/general";
import ssoService from "@services/sso/sso.services";
import {
  generateFakeAccessTokenPayload,
  isLocalhost
} from "@utils/helpers";

dotenv.config();


export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let decoded: any;

    const isDev =
     (process.env.NODE_ENV === "development" &&
      process.env.ALLOW_DEV_AUTH === "true" &&
      isLocalhost(req));

    if (isDev && !req.cookies?.access_token) {
      decoded = generateFakeAccessTokenPayload();
    } else {
      const accessToken = req.cookies?.access_token;
      if (!accessToken)
        return res.status(401).json(errorResponseOld("LOGIN REQUIRED 2"));

      decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!, {
        issuer: "en-auth",
        audience: "en-client"
      });
    }

    if (!isAccessTokenPayload(decoded))
      return res.status(401).json(errorResponseOld("INVALID TOKEN PAYLOAD"));

    const payload: AccessTokenPayload = decoded;

    if (!payload.sub || !payload.jti)
      return res.status(401).json(errorResponseOld("INVALID TOKEN"));

    // //#region - IN-MEMORY REVOKE
    // if (revokedJtiCache.get(payload.jti))
    //   return res.status(401).json(errorResponseOld("TOKEN REVOKED"));
    // //#endregion - IN-MEMORY REVOKE

    //#region - FALLBACK: POSTGRES
    const revoked = await userSchema.AuthRevokedJti.query()
      .where("jti", payload.jti)
      .andWhere("expires_at", ">", knex.fn.now())
      .first();
    //#endregion - FALLBACK: POSTGRES

    // if (revoked) {
    //   revokedJtiCache.set(payload.jti, true);
    //   return res.status(401).json(errorResponseOld("TOKEN REVOKED"));
    // }

    //#region - USER STATUS CACHE
    const cachedStatus = userStatusCache.get(payload.sub);
    if (cachedStatus === false)
      return res.status(403).json(errorResponseOld("ACCOUNT DISABLED"));

    if (cachedStatus === undefined) {
      const user = await userSchema.Users.query()
        .select("is_active")
        .where({ id: payload.sub })
        .first();

      if (!user || !user.is_active) {
        userStatusCache.set(payload.sub, false);
        return res.status(403).json(errorResponseOld("ACCOUNT DISABLED"));
      }

      userStatusCache.set(payload.sub, true);
    }
    //#endregion - USER STATUS CACHE

    req.currentUser = {
      sub: payload.sub,
      role: payload.role,
      jti: payload.jti,
      iss: payload.iss,
      aud: payload.aud,
      iat: payload.iat,
      exp: payload.exp
    };

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json(errorResponseOld("RELOGIN REQUIRED"));
    }

    return res.status(401).json(errorResponseOld("AUTH FAILED"));
  }
};

export default requireAuth;
