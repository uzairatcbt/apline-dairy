import { Router } from "express";
import { query } from "../config/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Helpers
const isManager = (role: string) => role === "manager";

router.use(requireAuth);

// List actions scoped by tenant/site and role
router.get("/", async (req: AuthedRequest, res) => {
  const ctx = req.userContext!;
  try {
    const rows = await query(
      `
        SELECT a.*, u.full_name AS assigned_to_name
        FROM actions a
        LEFT JOIN mt_users u ON u.user_id = a.assigned_to
        WHERE a.tenant_id = $1
          AND a.site_id = $2
          AND (
            $3 = 'manager' OR
            a.created_by = $4 OR
            a.assigned_to = $4
          )
        ORDER BY a.created_at DESC
      `,
      [ctx.tenantId, ctx.siteId, ctx.role, ctx.userId]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error("List actions failed", err);
    res.status(500).json({ error: "Failed to fetch actions" });
  }
});

// Get action by id with scoping
router.get("/:id", async (req: AuthedRequest, res) => {
  const ctx = req.userContext!;
  const { id } = req.params;
  try {
    const result = await query(
      `
        SELECT a.*, u.full_name AS assigned_to_name
        FROM actions a
        LEFT JOIN mt_users u ON u.user_id = a.assigned_to
        WHERE a.action_id = $1
          AND a.tenant_id = $2
          AND a.site_id = $3
          AND (
            $4 = 'manager' OR
            a.created_by = $5 OR
            a.assigned_to = $5
          )
        LIMIT 1
      `,
      [id, ctx.tenantId, ctx.siteId, ctx.role, ctx.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get action failed", err);
    res.status(500).json({ error: "Failed to fetch action" });
  }
});

// Create action
router.post("/", async (req: AuthedRequest, res) => {
  const ctx = req.userContext!;
  const { title, description, priority, due_date, assigned_to } = req.body || {};

  if (!title) return res.status(400).json({ error: "title is required" });

  // Operators can only assign to themselves or leave unassigned
  if (ctx.role === "operator" && assigned_to && assigned_to !== ctx.userId) {
    return res.status(403).json({ error: "Operators cannot assign to others" });
  }

  try {
    // If assigning, ensure same tenant + site
    if (assigned_to) {
      const check = await query(
        `SELECT 1 FROM mt_users WHERE user_id = $1 AND tenant_id = $2 AND site_id = $3`,
        [assigned_to, ctx.tenantId, ctx.siteId]
      );
      if (check.rowCount === 0) {
        return res.status(400).json({ error: "Assignee must be in the same site/tenant" });
      }
    }

    const result = await query(
      `
        INSERT INTO actions (
          tenant_id, site_id, title, description, status, priority, due_date, created_by, assigned_to
        ) VALUES ($1,$2,$3,$4,'open', COALESCE($5,'medium'), $6, $7, $8)
        RETURNING *
      `,
      [
        ctx.tenantId,
        ctx.siteId,
        title,
        description ?? null,
        priority ?? null,
        due_date ? new Date(due_date) : null,
        ctx.userId,
        assigned_to ?? null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create action failed", err);
    res.status(500).json({ error: "Failed to create action" });
  }
});

// Update status or assignment
router.patch("/:id", async (req: AuthedRequest, res) => {
  const ctx = req.userContext!;
  const { id } = req.params;
  const { status, assigned_to, priority, title, description, due_date } = req.body || {};

  try {
    // Fetch action to check scope and ownership
    const existing = await query(
      `SELECT * FROM actions WHERE action_id = $1 AND tenant_id = $2 AND site_id = $3`,
      [id, ctx.tenantId, ctx.siteId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: "Not found" });
    const action = existing.rows[0];

    const isOwner = action.created_by === ctx.userId || action.assigned_to === ctx.userId;
    if (!isManager(ctx.role) && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // If assigning, ensure same tenant + site
    if (assigned_to) {
      const check = await query(
        `SELECT 1 FROM mt_users WHERE user_id = $1 AND tenant_id = $2 AND site_id = $3`,
        [assigned_to, ctx.tenantId, ctx.siteId]
      );
      if (check.rowCount === 0) {
        return res.status(400).json({ error: "Assignee must be in the same site/tenant" });
      }
    }

    const result = await query(
      `
        UPDATE actions
        SET
          status = COALESCE($1, status),
          assigned_to = COALESCE($2, assigned_to),
          priority = COALESCE($3, priority),
          title = COALESCE($4, title),
          description = COALESCE($5, description),
          due_date = COALESCE($6, due_date)
        WHERE action_id = $7
          AND tenant_id = $8
          AND site_id = $9
        RETURNING *
      `,
      [
        status ?? null,
        assigned_to ?? null,
        priority ?? null,
        title ?? null,
        description ?? null,
        due_date ? new Date(due_date) : null,
        id,
        ctx.tenantId,
        ctx.siteId
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update action failed", err);
    res.status(500).json({ error: "Failed to update action" });
  }
});

export default router;
