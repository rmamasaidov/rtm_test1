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

  return {
    expiresIn: Math.floor(OTP_TTL_MS / 1000)
  };
};
