import { Express } from "express";
import testRouter from "./test";
import authRouter from "./auth";
import actionsRouter from "./actions";
import { healthRouter } from "./health";
import usersRouter from "./users";

export const registerRoutes = (app: Express) => {
  app.use("/health", healthRouter);
  app.use("/test", testRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/actions", actionsRouter);
  app.use("/api/users", usersRouter);
};
