import { Request, Response } from "express";

import { requestOtp, verifyOtp } from "../services/otp.service";
import { createSession, getSession, revokeSession } from "../services/session.service";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS
} from "../services/token.service";
import { getOrCreateUser } from "../services/user.service";

export const requestOtpHandler = (req: Request, res: Response) => {
  const phoneNumber = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "phone is required"
    });
  }

  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber format is invalid"
    });
  }

  const result = requestOtp(phoneNumber);

  return res.status(200).json({
    success: true,
    message: "OTP generated",
    expiresIn: result.expiresIn
  });
};

export const verifyOtpHandler = (req: Request, res: Response) => {
  const phoneNumber = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (!phoneNumber || !code) {
    return res.status(400).json({
      success: false,
      message: "phone and code are required"
    });
  }

  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber format is invalid"
    });
  }

  const result = verifyOtp(phoneNumber, code);

  if (!result.ok) {
    const message =
      result.reason === "expired"
        ? "OTP expired"
        : result.reason === "mismatch"
          ? "OTP mismatch"
          : "OTP not found";
    return res.status(400).json({ success: false, message });
  }

  const user = getOrCreateUser(phoneNumber);
  const accessToken = issueAccessToken(user.id, user.phoneNumber);
  const refreshToken = issueRefreshToken(user.id, user.phoneNumber);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  createSession(user.id, refreshToken, expiresAt);

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber
    },
    tokens: {
      accessToken,
      refreshToken
    }
  });
};

export const refreshTokenHandler = (req: Request, res: Response) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "";

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "refreshToken is required"
    });
  }

  let payload: { sub: string; phoneNumber: string };
  try {
    payload = verifyRefreshToken(refreshToken) as { sub: string; phoneNumber: string };
  } catch {
    return res.status(401).json({ success: false, message: "refreshToken is invalid" });
  }

  const session = getSession(refreshToken);
  if (!session) {
    return res.status(401).json({ success: false, message: "session not found" });
  }

  if (session.expiresAt.getTime() < Date.now()) {
    revokeSession(refreshToken);
    return res.status(401).json({ success: false, message: "refreshToken expired" });
  }

  const accessToken = issueAccessToken(payload.sub, payload.phoneNumber);

  return res.status(200).json({
    success: true,
    accessToken
  });
};
