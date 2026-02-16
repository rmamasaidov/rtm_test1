type OtpRecord = {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map<string, OtpRecord>();

const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const mockSendSms = (phoneNumber: string, code: string) => {
  // Mock SMS sending for now.
  console.log(`[mock-sms] ${phoneNumber} -> ${code}`);
};

export const requestOtp = (phoneNumber: string) => {
  const code = generateOtpCode();
  const now = new Date();
  const record: OtpRecord = {
    phoneNumber,
    code,
    createdAt: now,
    expiresAt: new Date(now.getTime() + OTP_TTL_MS)
  };

  otpStore.set(phoneNumber, record);
  mockSendSms(phoneNumber, code);

  return {
    expiresIn: Math.floor(OTP_TTL_MS / 1000)
  };
};

export const verifyOtp = (phoneNumber: string, code: string) => {
  const record = otpStore.get(phoneNumber);

  if (!record) {
    return { ok: false, reason: "not_found" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    otpStore.delete(phoneNumber);
    return { ok: false, reason: "expired" as const };
  }

  if (record.code !== code) {
    return { ok: false, reason: "mismatch" as const };
  }

  otpStore.delete(phoneNumber);
  return { ok: true as const };
};
