import { Router } from "express";
import { query } from "../config/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// Helpers
const getScope = (req: AuthedRequest) => {
  const ctx = req.userContext;
  if (!ctx) throw new Error("Missing auth context");
  return ctx;
};
const notFound = (res: any, message = "Not found") => res.status(404).json({ error: message });
const forbidden = (res: any, message = "Forbidden") => res.status(403).json({ error: message });
const badRequest = (res: any, message: string) => res.status(400).json({ error: message });
const serverError = (res: any, label: string, err: unknown) => {
  console.error(label, err);
  return res.status(500).json({ error: "Internal server error" });
};

const isManager = (role: string) => role === "manager";
const ALLOWED_STATUS = ["open", "in_progress", "completed"] as const;
const ALLOWED_PRIORITIES = ["low", "medium", "high", "critical"] as const;

type ValidationResult = { ok: true } | { ok: false; message: string };

const validateCreateBody = (body: any): ValidationResult => {
  const { title, description, priority, due_date, assigned_to } = body ?? {};

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return { ok: false, message: "title is required (min 3 chars)" };
  }

  if (description && typeof description !== "string") {
    return { ok: false, message: "description must be a string" };
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return { ok: false, message: `priority must be one of ${ALLOWED_PRIORITIES.join(", ")}` };
  }

  if (assigned_to && typeof assigned_to !== "string") {
    return { ok: false, message: "assigned_to must be a string user id" };
  }

  if (due_date) {
    const date = new Date(due_date);
    if (isNaN(date.getTime())) {
      return { ok: false, message: "due_date must be a valid date" };
    }
  }

  return { ok: true };
};

const validateUpdateBody = (body: any): ValidationResult => {
  const { status, priority, title, description, due_date, assigned_to } = body ?? {};

  if (status && !ALLOWED_STATUS.includes(status)) {
    return { ok: false, message: `status must be one of ${ALLOWED_STATUS.join(", ")}` };
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return { ok: false, message: `priority must be one of ${ALLOWED_PRIORITIES.join(", ")}` };
  }

  if (title && (typeof title !== "string" || title.trim().length < 3)) {
    return { ok: false, message: "title must be at least 3 characters" };
  }

  if (description && typeof description !== "string") {
    return { ok: false, message: "description must be a string" };
  }

  if (assigned_to && typeof assigned_to !== "string") {
    return { ok: false, message: "assigned_to must be a string user id" };
  }

  if (due_date) {
    const date = new Date(due_date);
    if (isNaN(date.getTime())) {
      return { ok: false, message: "due_date must be a valid date" };
    }
  }

  return { ok: true };
};

router.use(requireAuth);

// List actions scoped by tenant/site and role
router.get("/", async (req: AuthedRequest, res) => {
  const ctx = getScope(req);
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

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
        LIMIT $5 OFFSET $6
      `,
      [ctx.tenantId, ctx.siteId, ctx.role, ctx.userId, limit, offset]
    );
    return res.json(rows.rows);
  } catch (err) {
    return serverError(res, "List actions failed", err);
  }
});

// Get action by id with scoping
router.get("/:id", async (req: AuthedRequest, res) => {
  const ctx = getScope(req);
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
    if (result.rows.length === 0) return notFound(res);
    return res.json(result.rows[0]);
  } catch (err) {
    return serverError(res, "Get action failed", err);
  }
});

// Create action
router.post("/", async (req: AuthedRequest, res) => {
  const ctx = getScope(req);
  const { title, description, priority, due_date, assigned_to } = req.body || {};

  const validation = validateCreateBody(req.body);
  if (!validation.ok) return badRequest(res, validation.message);

  // Operators can only assign to themselves or leave unassigned
  if (ctx.role === "operator" && assigned_to && assigned_to !== ctx.userId) {
    return forbidden(res, "Operators cannot assign to others");
  }

  try {
    // If assigning, ensure same tenant + site
    if (assigned_to) {
      const check = await query(
        `SELECT 1 FROM mt_users WHERE user_id = $1 AND tenant_id = $2 AND site_id = $3`,
        [assigned_to, ctx.tenantId, ctx.siteId]
      );
      if (check.rowCount === 0) {
        return badRequest(res, "Assignee must be in the same site/tenant");
      }
    }

    const result = await query(
      `
        INSERT INTO actions (
          tenant_id, site_id, title, description, status, priority, due_date, created_by, assigned_to
        ) VALUES ($1,$2,$3,$4,'open', COALESCE($5,'medium'), $6, $7, $8)
        RETURNING action_id
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
    const createdId = result.rows[0].action_id;
    const created = await query(
      `
        SELECT a.*, u.full_name AS assigned_to_name
        FROM actions a
        LEFT JOIN mt_users u ON u.user_id = a.assigned_to
        WHERE a.action_id = $1 AND a.tenant_id = $2 AND a.site_id = $3
      `,
      [createdId, ctx.tenantId, ctx.siteId]
    );

    return res.status(201).json(created.rows[0]);
  } catch (err) {
    return serverError(res, "Create action failed", err);
  }
});

// Update status or assignment
router.patch("/:id", async (req: AuthedRequest, res) => {
  const ctx = getScope(req);
  const { id } = req.params;
  const { status, assigned_to, priority, title, description, due_date } = req.body || {};

  const validation = validateUpdateBody(req.body);
  if (!validation.ok) return badRequest(res, validation.message);

  try {
    // Fetch action to check scope and ownership
    const existing = await query(
      `SELECT * FROM actions WHERE action_id = $1 AND tenant_id = $2 AND site_id = $3`,
      [id, ctx.tenantId, ctx.siteId]
    );
    if (existing.rowCount === 0) return notFound(res);
    const action = existing.rows[0];

    const isOwner = action.created_by === ctx.userId || action.assigned_to === ctx.userId;
    if (!isManager(ctx.role) && !isOwner) {
      return forbidden(res);
    }

    if (ctx.role === "operator" && assigned_to && assigned_to !== ctx.userId) {
      return forbidden(res, "Operators cannot assign to others");
    }

    // If assigning, ensure same tenant + site
    if (assigned_to) {
      const check = await query(
        `SELECT 1 FROM mt_users WHERE user_id = $1 AND tenant_id = $2 AND site_id = $3`,
        [assigned_to, ctx.tenantId, ctx.siteId]
      );
      if (check.rowCount === 0) {
        return badRequest(res, "Assignee must be in the same site/tenant");
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
        RETURNING action_id
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
    const updatedId = result.rows[0].action_id;
    const updated = await query(
      `
        SELECT a.*, u.full_name AS assigned_to_name
        FROM actions a
        LEFT JOIN mt_users u ON u.user_id = a.assigned_to
        WHERE a.action_id = $1 AND a.tenant_id = $2 AND a.site_id = $3
      `,
      [updatedId, ctx.tenantId, ctx.siteId]
    );
    return res.json(updated.rows[0]);
  } catch (err) {
    return serverError(res, "Update action failed", err);
  }
});

export default router;
