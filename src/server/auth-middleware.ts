import jwt from "jsonwebtoken";
import { env } from "../shared/config/env.js";

const JWT_SECRET = env.JWT_SECRET;

export const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // SUPERADMIN can do everything
    if (req.user.role === "SUPERADMIN") return next();

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(", ")}]` });
    }
    next();
  };
};

export const authorizeAdmin = authorize("ADMIN", "SUPERADMIN");
