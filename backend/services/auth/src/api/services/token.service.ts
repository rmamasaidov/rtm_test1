import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

type TokenPayload = {
  sub: string;
  phoneNumber: string;
};

export const issueAccessToken = (userId: string, phoneNumber: string) => {
  const payload: TokenPayload = { sub: userId, phoneNumber };
  return jwt.sign(payload, accessSecret, { expiresIn: ACCESS_TOKEN_TTL });
};

export const issueRefreshToken = (userId: string, phoneNumber: string) => {
  const payload: TokenPayload = { sub: userId, phoneNumber };
  return jwt.sign(payload, refreshSecret, { expiresIn: REFRESH_TOKEN_TTL });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, refreshSecret) as TokenPayload;
};
