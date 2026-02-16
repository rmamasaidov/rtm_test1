import { Router } from "express";

import { refreshTokenHandler, requestOtpHandler, verifyOtpHandler } from "../controllers/auth.controller";

const router = Router();

router.post("/request-otp", requestOtpHandler);
router.post("/verify-otp", verifyOtpHandler);
router.post("/refresh", refreshTokenHandler);

export default router;
