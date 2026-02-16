import { randomUUID } from "crypto";

type User = {
  id: string;
  phoneNumber: string;
  createdAt: Date;
  lastLoginAt: Date;
};

const usersByPhone = new Map<string, User>();

export const getOrCreateUser = (phoneNumber: string) => {
  const existing = usersByPhone.get(phoneNumber);
  const now = new Date();

  if (existing) {
    existing.lastLoginAt = now;
    return existing;
  }

  const user: User = {
    id: randomUUID(),
    phoneNumber,
    createdAt: now,
    lastLoginAt: now
  };

  usersByPhone.set(phoneNumber, user);
  return user;
};
