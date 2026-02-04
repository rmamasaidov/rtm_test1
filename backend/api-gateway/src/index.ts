import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const authTarget = process.env.AUTH_SERVICE_URL || "http://localhost:4001";

app.use(
  "/auth",
  createProxyMiddleware({
    target: authTarget,
    changeOrigin: true,
    pathRewrite: { "^/auth": "/auth" }
  })
);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port);
