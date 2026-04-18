import { Request, Response } from "express";
import dotenv from "dotenv";
import devConfig from "@config/devConfig";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { user } from "@resitdc/hayuah-models";
import { errorResponseOld } from "@utils/response";
import { isLocalhost } from "@utils/helpers";
import ssoService from "@services/sso/sso.services";
import { signAccessToken } from "@utils/jwt";
import { AccessTokenPayload, RefreshTokenPayload } from "@root/src/dataTypes";
dotenv.config();
const accessTokenPath = "/api";
const isLocal = process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_AUTH === "true";

const isDevBypass = (req: Request) =>
  process.env.NODE_ENV === "development" &&
  process.env.ALLOW_DEV_AUTH === "true" &&
  isLocalhost(req);

export const exchange = async (req: Request, res: Response) => {
  const {
    code,
  } = req.body;

  try {
    const execution = await ssoService.generateToken(code);
    if (execution.success) {
      const accessToken = execution.results.accessToken;
      const accessTokenDecoded = jwt.decode(accessToken) as AccessTokenPayload;
      const lifespanInSeconds = accessTokenDecoded.exp - accessTokenDecoded.iat;
      const extraTimeInSeconds = lifespanInSeconds * 0.20;
      const newExpInSeconds = accessTokenDecoded.exp + extraTimeInSeconds;
      const expirationDate = new Date(newExpInSeconds * 1000);

      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: !isLocal,
        ...(isLocal ? {} : { domain: ".escapenomade.com" }),
        sameSite: isLocal ? "lax" : "none",
        path: accessTokenPath,
        expires: expirationDate
      });
      return res.status(200).json({
        success: true,
        message: "SUCCESS",
        results: {
          user: execution.results.user
        }
      });
    } else {
      return res.status(400).json(errorResponseOld(execution.message));
    }
  } catch (err) {
    console.log("ERROR KESINI KAH : ", err);
    return res.status(500).json(errorResponseOld("INTERNAL ERROR"));
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const execution = await ssoService.logout();
    if (execution.success) {
      return res.status(200).json({
        success: true,
        message: "LOGGED OUT",
      });
    } else {
      return res.status(400).json(errorResponseOld(execution.message));
    }
  } catch (err) {
    console.log("ERROR LOGOUT : ", err);
    return res.status(500).json(errorResponseOld("INTERNAL ERROR"));
  } finally {
    res.clearCookie("access_token", { path: accessTokenPath });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(errorResponseOld("MISSING SSO TOKEN"));
    }

    const ssoAccessToken = authHeader.replace("Bearer ", "");

    const payload = jwt.verify(
      ssoAccessToken,
      process.env.JWT_ACCESS_SECRET!,
      {
        issuer: "en-auth",
        audience: "en-client"
      }
    ) as AccessTokenPayload;

    if (!payload.sub || !payload.role) {
      return res.status(401).json(errorResponseOld("INVALID SSO TOKEN"));
    }

    const dashboardAccessToken = signAccessToken({
      sub: payload.sub,
      role: payload.role,
      jti: uuid()
    });

    const lifespanInSeconds = payload.exp - payload.iat;
    const extraTimeInSeconds = lifespanInSeconds * 0.20;
    const newExpInSeconds = payload.exp + extraTimeInSeconds;
    const expirationDate = new Date(newExpInSeconds * 1000);
    
    res.cookie("access_token", dashboardAccessToken, {
      httpOnly: true,
      secure: !isLocal,
      ...(isLocal ? {} : { domain: ".escapenomade.com" }),
      sameSite: isLocal ? "lax" : "none",
      path: accessTokenPath,
      expires: expirationDate
    });

    return res.status(200).json({
      success: true,
      message: "REFRESHED"
    });
  } catch (err: any) {
    return res.status(401).json(errorResponseOld("SSO TOKEN INVALID"));
  }
};

export const check = async (req: Request, res: Response) => {
  if (isDevBypass(req)) {
    return res.json({
      success: true,
      results: {
        user: {
          userId: devConfig.id,
          role: devConfig.role,
        },
      },
    });
  }

  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "NO SESSION"
    });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
      {
        issuer: "en-auth",
        audience: "en-client"
      }
    ) as RefreshTokenPayload;

    const session = await user.UserSessions.query()
      .where({
        id: payload.sid,
        revoke: false
      })
      .andWhere("expires_at", ">", new Date().toISOString())
      .first();

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "SESSION EXPIRED"
      });
    }

    return res.json({ success: true });
  } catch {
    return res.status(401).json({
      success: false,
      message: "INVALID SESSION"
    });
  }
};

export const checkBackup = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser?.sub)
      return res.status(401).json(errorResponseOld("UNAUTHENTICATED DISINI 01"));

    return res.json({
      success: true,
      results: {
        user: {
          userId: req.currentUser.sub,
          role: req.currentUser.role,
        }
      }
    });
  } catch (err) {
    return res.status(401).json(errorResponseOld("TOKEN IS NOT VALID"));
  }
};
