import { Router } from "express";
import { query } from "../config/db";

const router = Router();

// Basic service check
router.get("/", (_req, res) => {
  res.json({ ok: true, message: "API online", timestamp: new Date().toISOString() });
});

// Database connectivity check
router.get("/db", async (_req, res) => {
  try {
    const result = await query("SELECT NOW() AS now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    console.error("DB test failed", err);
    res.status(500).json({ ok: false, error: "Database unavailable" });
  }
});

export default router;
