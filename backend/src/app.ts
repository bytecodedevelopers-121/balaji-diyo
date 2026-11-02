import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import hpp from "hpp";

import { appConfig } from "./config/app-config";
import { corsOptions } from "./config/cors";
import { helmetOptions } from "./config/helmet";
import { globalLimiter, speedLimiter } from "./config/rate-limit";
import { PUBLIC_ROOT } from "./config/storage";

import apiRoutes from "./routes/index";
import { requestId } from "./common/middleware/request-id.middleware";
import { httpLogger } from "./common/utils/logger";
import { notFound } from "./common/middleware/not-found.middleware";
import { errorHandler } from "./common/middleware/error.middleware";

const app = express();

// ── Trust proxy (correct IP behind nginx / ELB) ────────────────────────────
app.set("trust proxy", appConfig.trustProxy);

// ── Security ───────────────────────────────────────────────────────────────
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));


// ── Request enrichment ─────────────────────────────────────────────────────
app.use(requestId);

// ── Parsing ────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: appConfig.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: appConfig.bodyLimit }));

// ── HTTP parameter pollution ───────────────────────────────────────────────
app.use(hpp());

// ── Compression ────────────────────────────────────────────────────────────
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────────
app.use(httpLogger);

// ── Health check (no auth, no rate limit) ─────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    env: appConfig.env,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Public file uploads (no auth — images are already sanitised/compressed) ──
// Cross-Origin-Resource-Policy must be "cross-origin" so browsers on a
// different origin (e.g. Vite dev server) can load these images in <img> tags.
// Helmet sets "same-origin" globally; we override it only for this route.
app.use(
  "/files/public",
  express.static(PUBLIC_ROOT, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// ── API routes ─────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── 404 + error handlers (must be last) ───────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;