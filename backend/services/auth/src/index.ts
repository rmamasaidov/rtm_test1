import express from "express";

import authRoutes from "./api/routes/auth.routes";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 4001;

app.listen(port);
