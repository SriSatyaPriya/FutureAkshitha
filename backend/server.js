const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const pool = require("./db");
const { authenticate, requireRole } = require("./middleware/auth");

const app = express();

app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: false, // SPA served by Vite/nginx; CSP configured there
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Allow the deployed frontend origin plus any separately hosted frontend origins.
const appOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : null;
const allowedOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === appOrigin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Small JSON bodies only; uploads go through multipart endpoints.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

// General API limiter
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
}));

// Stricter limiter for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Multipart-only body size guard for the document upload route
app.use("/api/documents", (req, res, next) => {
  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > 15 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      message: "Upload too large. Each file must be 5 MB or smaller.",
    });
  }
  next();
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api/internships", require("./routes/internships"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/placement", require("./routes/placement"));
app.use("/api/learning", require("./routes/learning"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/certificates", require("./routes/certificates"));

app.get("/", (req, res) => {
  if (process.env.SERVE_FRONTEND === "true") {
    return res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
  }

  res.json({
    success: true,
    message: "Future Akshitha Backend is running!",
  });
});

// Health/readiness with a real database check
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1");
    res.json({
      success: true,
      status: "ok",
      database: rows.length === 1 ? "connected" : "unknown",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "degraded",
      database: "unreachable",
      message: error.code || "database not available",
    });
  }
});

// Student-facing profile endpoint (id/role come from the verified JWT)
app.get("/api/auth/me", authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

app.use("/private-documents", (req, res) => {
  res.status(403).json({
    success: false,
    message: "Documents are served only through authorized download endpoints",
  });
});

// 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Serve the built frontend when deployed from one origin
if (process.env.SERVE_FRONTEND === "true") {
  const frontendDist = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Centralized error handler
app.use((error, req, res, next) => {
  if (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Each file must be 5 MB or smaller.",
      });
    }

    if (error.message === "Origin not allowed by CORS") {
      return res.status(403).json({
        success: false,
        message: "Request origin is not allowed",
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: error.code === "LIMIT_FILE_SIZE"
          ? "File too large. Each file must be 5 MB or smaller."
          : error.message || "Invalid upload",
      });
    }

    console.error("Unhandled error:", error.message, "at", req.method, req.url);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production"
        ? "An internal error occurred. Please try again later."
        : `Internal error: ${error.message}`,
    });
  }
  next();
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Future Akshitha backend running on port ${PORT}`);

  // Fail fast if the database is unreachable at startup.
  pool
    .query("SELECT 1")
    .then(() => console.log("Database connection verified"))
    .catch((error) => {
      console.error("Database connection check failed:", error.code, error.message);
      server.close(() => process.exit(1));
    });
});
