import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db";
import { signToken } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await query(
      `
        SELECT user_id, tenant_id, site_id, email, full_name, role, password_hash
        FROM mt_users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      userId: user.user_id,
      tenantId: user.tenant_id,
      siteId: user.site_id,
      role: user.role,
      email: user.email,
      fullName: user.full_name
    });

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        siteId: user.site_id
      }
    });
  } catch (err) {
    console.error("Login failed", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
