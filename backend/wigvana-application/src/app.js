import express from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";

const app = express();

app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());

app.use(errorHandler);

export default app;
