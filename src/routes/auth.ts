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
        SELECT 
          u.user_id,
          u.tenant_id,
          u.site_id,
          u.email,
          u.full_name,
          u.role,
          u.password_hash,
          s.site_name
        FROM mt_users u
        JOIN sites s ON s.site_id = u.site_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      console.log("[auth] login failed: user not found", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    console.log("[auth] login attempt", { email, ok });
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
        name: user.full_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        siteId: user.site_id,
        siteName: user.site_name
      }
    });
  } catch (err) {
    console.error("Login failed", err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
