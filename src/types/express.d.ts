import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    userContext?: {
      userId: string;
      tenantId: string;
      siteId: string;
      role: "operator" | "manager";
      email: string;
      fullName: string;
    };
  }
}
