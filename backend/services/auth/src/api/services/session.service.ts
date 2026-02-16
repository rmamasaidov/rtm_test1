type Session = {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
};

const sessionsByToken = new Map<string, Session>();

export const createSession = (userId: string, refreshToken: string, expiresAt: Date) => {
  const session: Session = {
    userId,
    refreshToken,
    expiresAt,
    createdAt: new Date()
  };

  sessionsByToken.set(refreshToken, session);
  return session;
};

export const getSession = (refreshToken: string) => {
  return sessionsByToken.get(refreshToken);
};

export const revokeSession = (refreshToken: string) => {
  sessionsByToken.delete(refreshToken);
};
