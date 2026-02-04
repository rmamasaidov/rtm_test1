import { Router } from "express";

import { requestOtpHandler } from "../controllers/auth.controller";

const router = Router();

router.post("/request-otp", requestOtpHandler);

export default router;
