import { Express } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import tasksRouter from "./tasks";

export const registerRoutes = (app: Express) => {
  app.use("/health", healthRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/tasks", tasksRouter);
};
