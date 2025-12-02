import { Router } from "express";
import { query } from "../config/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// List users scoped to tenant/site
router.get("/", async (req: AuthedRequest, res) => {
  const ctx = req.userContext!;
  try {
    const result = await query(
      `
        SELECT user_id, full_name, email, role, site_id
        FROM mt_users
        WHERE tenant_id = $1 AND site_id = $2
        ORDER BY full_name
      `,
      [ctx.tenantId, ctx.siteId]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error("List users failed", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
