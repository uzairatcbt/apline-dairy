import { Router } from "express";
import { query } from "../config/db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await query(
      `
        SELECT
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.created_at,
          u.updated_at,
          ARRAY(
            SELECT t.name
            FROM teams t
            JOIN user_teams ut ON ut.team_id = t.id
            WHERE ut.user_id = u.id
          ) AS teams
        FROM users u
        ORDER BY u.created_at DESC
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch users", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/", async (req, res) => {
  const { email, fullName, role, passwordHash } = req.body || {};
  if (!email || !fullName || !passwordHash) {
    return res.status(400).json({ error: "email, fullName, and passwordHash are required" });
  }

  try {
    const result = await query(
      `
        INSERT INTO users (email, full_name, role, password_hash)
        VALUES ($1, $2, COALESCE($3, 'user'), $4)
        ON CONFLICT (email) DO NOTHING
        RETURNING *
      `,
      [email, fullName, role ?? null, passwordHash]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create user", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
