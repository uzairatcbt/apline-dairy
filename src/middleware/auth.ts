import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type TokenPayload = {
  userId: string;
  tenantId: string;
  siteId: string;
  role: "operator" | "manager";
  email: string;
  fullName: string;
};

export const signToken = (payload: TokenPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.userContext = decoded;
    return next();
  } catch (err) {
    console.error("JWT verification failed", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
