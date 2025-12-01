import { Express } from "express";
import testRouter from "./test";
import authRouter from "./auth";
import actionsRouter from "./actions";

export const registerRoutes = (app: Express) => {
  app.use("/test", testRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/actions", actionsRouter);
};
