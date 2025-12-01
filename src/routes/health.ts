import { Router } from "express";
import { query } from "../config/db";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/db", async (_req, res) => {
  try {
    const result = await query("SELECT NOW() AS now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    console.error("DB health failed", err);
    res.status(500).json({ ok: false, error: "Database unavailable" });
  }
});

export default router;
