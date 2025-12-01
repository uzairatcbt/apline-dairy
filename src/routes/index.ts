import { Express } from "express";
import testRouter from "./test";
import usersRouter from "./users";
import tasksRouter from "./tasks";

export const registerRoutes = (app: Express) => {
  app.use("/test", testRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/tasks", tasksRouter);
};
