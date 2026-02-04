import { Request, Response } from "express";

import { requestOtp } from "../services/auth.service";

const isValidPhoneNumber = (phoneNumber: string) => {
  return /^\+\d{10,15}$/.test(phoneNumber);
};

export const requestOtpHandler = (req: Request, res: Response) => {
  const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber is required"
    });
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber must be in E.164 format"
    });
  }

  const result = requestOtp(phoneNumber);

  return res.status(200).json({
    success: true,
    message: "OTP generated",
    expiresIn: result.expiresIn
  });
};
