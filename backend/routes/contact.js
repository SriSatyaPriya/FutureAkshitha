const express = require("express");
const rateLimit = require("express-rate-limit");
const pool = require("../db");

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many enquiries from this network. Please try again later.",
  },
});

const PHONE_RE = /^\+?[0-9\s-]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ENQUIRY_TYPES = new Set([
  "Courses and Training",
  "Internships",
  "College Partnership",
  "Projects",
  "Career Guidance",
  "Other Enquiry",
]);

// Stores the enquiry in MySQL so the team can follow up. Email sending is
// intentionally not performed here (no transactional email setup assumed).
router.post("/", contactLimiter, async (req, res) => {
  try {
    const full_name = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    const organization =
      typeof req.body.organization === "string" ? req.body.organization.trim() : "";
    const enquiry_type =
      typeof req.body.enquiryType === "string" ? req.body.enquiryType.trim() : "";
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!full_name || full_name.length < 2) {
      return res.status(400).json({ success: false, message: "Enter your full name" });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (phone && !PHONE_RE.test(phone)) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }

    if (!ENQUIRY_TYPES.has(enquiry_type)) {
      return res.status(400).json({ success: false, message: "Select a valid enquiry type" });
    }

    if (message.length < 10 || message.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 3000 characters",
      });
    }

    await pool.execute(
      `INSERT INTO contact_messages
        (full_name, email, phone, organization, enquiry_type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        full_name.slice(0, 150),
        email.slice(0, 150),
        phone || null,
        organization || null,
        enquiry_type,
        message,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Your enquiry has been received. Our team will reach out to you.",
    });
  } catch (error) {
    console.error("Contact submit error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to submit your enquiry right now. Please try again later.",
    });
  }
});

module.exports = router;
