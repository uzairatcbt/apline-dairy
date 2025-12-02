import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

export const createApp = () => {
  const app = express();

  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  app.use(cors(allowedOrigin ? { origin: allowedOrigin } : undefined));
  app.use(express.json());

  // Simple request logger for debugging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

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
