import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      name: "MSP Entelligence API",
      status: "online",
      docs: "/health"
    });
  });

  registerRoutes(app);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
};
