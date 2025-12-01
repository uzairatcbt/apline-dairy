import { Router } from "express";
import { query } from "../config/db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await query(
      `
        SELECT
          t.id,
          t.title,
          t.description,
          t.status,
          t.due_date,
          t.created_at,
          t.updated_at,
          u.full_name AS assigned_to_name,
          t.assigned_to,
          tm.name AS team_name,
          t.team_id
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN teams tm ON tm.id = t.team_id
        ORDER BY t.created_at DESC
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch tasks", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/", async (req, res) => {
  const { title, description, status, dueDate, assignedTo, teamId } = req.body || {};

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const result = await query(
      `
        INSERT INTO tasks (title, description, status, due_date, assigned_to, team_id)
        VALUES ($1, $2, COALESCE($3, 'pending'), $4, $5, $6)
        RETURNING *
      `,
      [
        title,
        description ?? null,
        status ?? null,
        dueDate ? new Date(dueDate) : null,
        assignedTo ?? null,
        teamId ?? null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to create task", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

export default router;
