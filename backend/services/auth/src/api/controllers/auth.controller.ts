import { Request, Response } from "express";

import { requestOtp } from "../services/auth.service";

export const requestOtpHandler = (req: Request, res: Response) => {
  const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "phoneNumber is required"
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
