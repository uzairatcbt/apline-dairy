import { Router } from "express";
import { query } from "../config/db";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const started = process.env.STARTED_AT ?? "";
  try {
    const result = await query("SELECT NOW() AS now");
    return res.json({
      status: "ok",
      db: true,
      time: result.rows[0].now,
      uptimeSeconds: started ? Math.floor((Date.now() - Number(started)) / 1000) : undefined
    });
  } catch (err) {
    console.error("Health check failed", err);
    return res.status(500).json({ status: "degraded", db: false, error: "DB unavailable" });
  }
});
