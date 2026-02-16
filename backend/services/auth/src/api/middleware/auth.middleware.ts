import { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../services/token.service";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, phoneNumber: payload.phoneNumber };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
