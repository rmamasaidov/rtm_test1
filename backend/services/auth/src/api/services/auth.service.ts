type OtpRecord = {
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
};

const OTP_TTL_MS = 5 * 60 * 1000;
const otpStore = new Map<string, OtpRecord>();

const generateOtpCode = (): string => {
  const length = Math.floor(4 + Math.random() * 3);
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
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
