
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


const router = express.Router();

const allowedRoles = ["student", "company"];

// Academic fields a student can maintain on their own profile
const PROFILE_FIELDS = [
  "education",
  "college",
  "course",
  "branch",
  "domain",
  "skills",
];
const EDUCATION_OPTIONS = [
  "10th", "12th", "Intermediate", "Diploma", "Degree", "Graduate", "Postgraduate",
];
const ALLOWED_DOMAINS = ["IT", "Non-IT"];

router.post("/register", async (req, res) => {
  try {
    const { full_name, email, password, role, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const selectedRole = role || "student";

    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role"
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Optional student academic hints collected at registration
    const education =
      typeof req.body.education === "string" &&
      EDUCATION_OPTIONS.includes(req.body.education.trim())
        ? req.body.education.trim()
        : null;
    const domain =
      typeof req.body.domain === "string" &&
      ALLOWED_DOMAINS.includes(req.body.domain.trim())
        ? req.body.domain.trim()
        : null;

    const [result] = await pool.execute(
      `INSERT INTO users
       (full_name, email, password_hash, role, phone, education, domain)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        selectedRole,
        phone || null,
        education,
        domain
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: result.insertId,
        full_name: full_name.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const [users] = await pool.execute(
      `SELECT id, full_name, email, password_hash, role, account_status
       FROM users WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    if (user.account_status && user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is suspended. Please contact support."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});


// Maintain the logged-in user's profile (students keep academic details here)
router.put("/profile", authenticate, async (req, res) => {
  try {
    const updates = [];
    const values = [];

    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : null;
    if (phone !== null) {
      if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number format is invalid",
        });
      }
      updates.push("phone = ?");
      values.push(phone || null);
    }

    if (req.user.role === "student") {
      for (const field of PROFILE_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

        const value = req.body[field];

        if (field === "education") {
          if (value && !EDUCATION_OPTIONS.includes(value)) {
            return res.status(400).json({
              success: false,
              message: "Invalid education level",
            });
          }
        } else if (field === "domain") {
          if (value && !ALLOWED_DOMAINS.includes(value)) {
            return res.status(400).json({
              success: false,
              message: "Domain must be IT or Non-IT",
            });
          }
        } else if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text`,
          });
        }

        updates.push(`${field} = ?`);
        values.push(value ? String(value).trim().slice(0, field === "skills" || field === "college" ? 500 : 200) || null : null);
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "graduation_year")) {
        const year = Number(req.body.graduation_year);
        if (req.body.graduation_year !== null && req.body.graduation_year !== "") {
          if (!Number.isInteger(year) || year < 1980 || year > 2100) {
            return res.status(400).json({
              success: false,
              message: "Graduation year must be a valid year",
            });
          }
          updates.push("graduation_year = ?");
          values.push(year);
        } else {
          updates.push("graduation_year = NULL");
        }
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "cgpa")) {
        if (req.body.cgpa !== null && req.body.cgpa !== "") {
          const cgpa = Number(req.body.cgpa);
          if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
            return res.status(400).json({
              success: false,
              message: "CGPA must be between 0 and 10",
            });
          }
          updates.push("cgpa = ?");
          values.push(cgpa);
        } else {
          updates.push("cgpa = NULL");
        }
      }
    } else {
      // Companies can only edit their phone here; company details live in the companies table
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide a phone number to update",
        });
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update",
      });
    }

    values.push(req.user.id);

    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, phone, education, college, course,
              branch, domain, skills, graduation_year, cgpa
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: "Profile updated",
      user: users[0],
    });
  } catch (error) {
    console.error("Update profile:", error.message);
    res.status(500).json({ success: false, message: "Unable to update profile" });
  }
});

router.get("/profile", authenticate, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, full_name, email, role, phone, education, college, course,
              branch, domain, skills, graduation_year, cgpa, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error("Get profile:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch profile" });
  }
});

// Stateless bearer-token logout: the client clears its session and the
// short token lifetime bounds any leaked token window.
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out" });
});


router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists for that email, a password reset link will be sent.";

  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );

    // Use the same response for registered and unregistered emails.
    if (!users.length) {
      return res.json({ success: true, message: genericMessage });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [user.id]
    );

    await pool.execute(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl =
      `${process.env.APP_URL}/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Reset your Future Akshitha password",
        text: `Use this link within 15 minutes to reset your password:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#102448">
            <h2 style="color:#102448">Future <span style="color:#c49a3a">Akshitha</span></h2>
            <h3>Password reset request</h3>
            <p>We received a request to reset your password.</p>
            <p>This link expires in 15 minutes and can only be used once.</p>
            <p>
              <a href="${resetUrl}"
                 style="display:inline-block;background:#102448;color:#ffffff;padding:13px 22px;text-decoration:none;border-radius:8px">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Invalidate the token if sending the email fails.
      await pool.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE token_hash = ? AND used_at IS NULL`,
        [tokenHash]
      );
      throw emailError;
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to process your request right now.",
    });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [tokens] = await pool.execute(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND expires_at > NOW()
         AND used_at IS NULL`,
      [tokenHash]
    );

    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or expired. Please request a new one.",
      });
    }

    const reset = tokens[0];
    const passwordHash = await bcrypt.hash(password, 12);

    // Update the password and consume the token atomically.
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [validTokens] = await connection.execute(
        `SELECT id
         FROM password_reset_tokens
         WHERE id = ?
           AND expires_at > NOW()
           AND used_at IS NULL
         FOR UPDATE`,
        [reset.id]
      );

      if (!validTokens.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "This reset link is invalid or expired. Please request a new one.",
        });
      }

      await connection.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [passwordHash, reset.user_id]
      );

      await connection.execute(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
        [reset.id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return res.json({
      success: true,
      message: "Password reset successful. Please sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to reset your password right now.",
    });
  }
});


module.exports = router;
