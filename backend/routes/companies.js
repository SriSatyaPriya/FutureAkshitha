
const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

async function requireCompany(req, res, next) {
  if (!req.user || req.user.role !== "company") {
    return res.status(403).json({
      success: false,
      message: "Company account required",
    });
  }
  next();
}

// Create a company profile for the logged-in company user
router.post(
  "/profile",
  authenticate,
  requireRole("company"),
  requireCompany,
  async (req, res) => {
    try {
      const { company_name, website, description } = req.body;

      if (typeof company_name !== "string" || !company_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Company name is required",
        });
      }

      const [existing] = await pool.execute(
        "SELECT id FROM companies WHERE user_id = ?",
        [req.user.id]
      );

      if (existing.length) {
        return res.status(409).json({
          success: false,
          message: "Company profile already exists",
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO companies
         (user_id, company_name, website, description)
         VALUES (?, ?, ?, ?)`,
        [
          req.user.id,
          company_name.trim().slice(0, 200),
          typeof website === "string" && website.trim()
            ? website.trim().slice(0, 255) : null,
          typeof description === "string" && description.trim()
            ? description.trim() : null,
        ]
      );

      notify(
        req.user.id,
        "company",
        "Company profile submitted",
        "Your company profile is awaiting verification by the administration.",
        "/company-dashboard"
      );

      res.status(201).json({
        success: true,
        message: "Company profile submitted for verification",
        company: {
          id: result.insertId,
          company_name: company_name.trim(),
          verification_status: "pending",
        },
      });
    } catch (error) {
      console.error("Company profile error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to create company profile",
      });
    }
  }
);

// Update the logged-in company's profile details
router.put(
  "/profile",
  authenticate,
  requireRole("company"),
  requireCompany,
  async (req, res) => {
    try {
      const updates = [];
      const values = [];

      if (Object.prototype.hasOwnProperty.call(req.body, "company_name")) {
        if (typeof req.body.company_name !== "string" || !req.body.company_name.trim()) {
          return res.status(400).json({ success: false, message: "Company name cannot be empty" });
        }
        updates.push("company_name = ?");
        values.push(req.body.company_name.trim().slice(0, 200));
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "website")) {
        if (req.body.website !== null && typeof req.body.website !== "string") {
          return res.status(400).json({ success: false, message: "Website must be text" });
        }
        updates.push("website = ?");
        values.push(req.body.website && req.body.website.trim()
          ? req.body.website.trim().slice(0, 255) : null);
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
        if (req.body.description !== null && typeof req.body.description !== "string") {
          return res.status(400).json({ success: false, message: "Description must be text" });
        }
        updates.push("description = ?");
        values.push(req.body.description && req.body.description.trim()
          ? req.body.description.trim() : null);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one company field to update",
        });
      }

      values.push(req.user.id);

      await pool.execute(
        `UPDATE companies SET ${updates.join(", ")} WHERE user_id = ?`,
        values
      );

      const [rows] = await pool.execute(
        `SELECT id, company_name, website, description,
                verification_status, reviewer_note, created_at
         FROM companies WHERE user_id = ?`,
        [req.user.id]
      );

      res.json({ success: true, message: "Company profile updated", company: rows[0] });
    } catch (error) {
      console.error("Company profile update:", error.message);
      res.status(500).json({ success: false, message: "Unable to update company profile" });
    }
  }
);

// Get the logged-in company's profile
router.get(
  "/profile",
  authenticate,
  requireRole("company"),
  requireCompany,
  async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, company_name, website, description,
                verification_status, reviewer_note, created_at
         FROM companies WHERE user_id = ?`,
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Company profile not found",
        });
      }

      res.json({ success: true, company: rows[0] });
    } catch (error) {
      console.error("Company profile fetch error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to fetch company profile",
      });
    }
  }
);

// Company dashboard statistics derived from the database
router.get(
  "/stats",
  authenticate,
  requireRole("company"),
  requireCompany,
  async (req, res) => {
    try {
      const [[company]] = await pool.execute(
        "SELECT id, verification_status FROM companies WHERE user_id = ?",
        [req.user.id]
      );

      if (!company) {
        return res.status(404).json({
          success: false,
          message: "Company profile not found",
        });
      }

      const [[{ totalListings }]] = await pool.execute(
        "SELECT COUNT(*) AS totalListings FROM internships WHERE company_id = ?",
        [company.id]
      );

      const [[{ activeListings }]] = await pool.execute(
        "SELECT COUNT(*) AS activeListings FROM internships WHERE company_id = ? AND status = 'open'",
        [company.id]
      );

      const [[{ totalApplicants }]] = await pool.execute(
        `SELECT COUNT(*) AS totalApplicants
         FROM applications a
         JOIN internships i ON i.id = a.internship_id
         WHERE i.company_id = ?`,
        [company.id]
      );

      const [[{ shortlisted }]] = await pool.execute(
        `SELECT COUNT(*) AS shortlisted
         FROM applications a
         JOIN internships i ON i.id = a.internship_id
         WHERE i.company_id = ? AND a.status IN ('shortlisted', 'interview', 'selected')`,
        [company.id]
      );

      res.json({
        success: true,
        stats: {
          verificationStatus: company.verification_status,
          totalListings,
          activeListings,
          totalApplicants,
          shortlisted,
        },
      });
    } catch (error) {
      console.error("Company stats error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to fetch company statistics",
      });
    }
  }
);

module.exports = router;
