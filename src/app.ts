import express, { Express } from "express";
import compression from "compression";
import helmetPkg from "helmet";
import { SERVER, ROUTES } from "./config/constants.js";
import { corsMiddleware, errorHandler, requestLogger } from "./middleware.js";
import proxyRoutes from "./proxy-routes.js";

// 🔒 Helmet v7 ESM-safe wrapper (NEVER breaks)
const helmet =
  (helmetPkg as any).default ?? helmetPkg;

const app: Express = express();

// Global middleware
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Custom middleware
app.use(corsMiddleware);
app.use(requestLogger);

// Routes
app.use(ROUTES.PROXY_BASE, proxyRoutes);

// Root
app.get("/", (_req, res) => {
  res.json({
    name: "Shinra Proxy",
    version: process.env.npm_package_version || "0.2.0",
    env: SERVER.NODE_ENV
  });
});

// Status
app.get(`${ROUTES.PROXY_BASE}/status`, (_req, res) => {
  const mem = process.memoryUsage();

  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

export default app;
