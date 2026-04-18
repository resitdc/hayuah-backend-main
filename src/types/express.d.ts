import { AccessTokenPayload } from "@dataTypes/general"; 

declare global {
  namespace Express {
    interface Request {
      currentUser?: AccessTokenPayload;
    }
  }
}