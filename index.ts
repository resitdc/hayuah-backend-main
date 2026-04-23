import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import routesV1 from "./src/routes/v1/index";
import knex from "@config/connection"; 
import { errorHandler, errorResponse } from "@utils/response";
import { initializeModels } from "@resitdc/hayuah-models";

const BASE_DOMAIN = "escapenomade.com";
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
// use this one for production
// app.use(cors({
//   origin(origin, callback) {
//     if (!origin) return callback(null, true);

//     try {
//       const url = new URL(origin);
//       const host = url.hostname;

//       if (
//         host === BASE_DOMAIN ||
//         host.endsWith("." + BASE_DOMAIN)
//       ) {
//         return callback(null, true);
//       }
//     } catch (_) {}

//     return callback(new Error("CORS blocked"), false);
//   },
//   credentials: true
// }));
app.use(cors({
  origin: true, 
}));

initializeModels(knex);

app.use("/api/v1", routesV1);

app.use((req: Request, res: Response, next: NextFunction) => {
  errorResponse(res, 404, `Not Found - ${req.originalUrl}`);
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`\x1b[94mServer started on\x1b[0m \x1b[92mhttp://localhost:${port}\x1b[0m`);
});
