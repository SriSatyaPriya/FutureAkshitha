const jwt = require("jsonwebtoken");
const pool = require("../db");

const ROLE_DASHBOARDS = "student company admin";

// Verifies the Bearer token and re-checks the user's role against the
// database on every request, so revoked/changed roles take effect immediately.
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(
      "SELECT id, role, account_status FROM users WHERE id = ?",
      [payload.id]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Account no longer exists",
      });
    }

    if (users[0].account_status && users[0].account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is suspended. Please contact support.",
      });
    }

    req.user = { id: users[0].id, role: users[0].role };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for your account type",
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, ROLE_DASHBOARDS };
