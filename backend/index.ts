import express from "express";

import db from "#src/config/database";
import { env } from "#src/config/env";

import {
  notFoundHandler,
  errorHandler,
  authenticate,
  sendResponse,
  internalOnly,
  apiRateLimiter,
  logRequest,
} from "#src/middleware";

import api from "#src/routes/";
import user from "#src/routes/userRoutes";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Initialize Database
db.initDatabase();

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.use("/api", logRequest, internalOnly, apiRateLimiter, api, sendResponse);
app.use("/mock", authenticate, user, sendResponse);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;
const ENV = env.NODE_ENV;
app.listen(PORT, () => {
  console.log(`[${ENV}] Server listening on http://127.0.0.1:${PORT}`);
});
