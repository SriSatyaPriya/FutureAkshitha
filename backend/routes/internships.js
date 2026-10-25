const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const router = express.Router();

const ALLOWED_DOMAINS = ["IT", "Non-IT"];
const ALLOWED_WORK_TYPES = ["Remote", "Hybrid", "On-site"];

// Public: list open internship/job listings from approved companies
// GET /api/internships?kind=internship|job&domain=&work_type=&duration=&search=
router.get("/", async (req, res) => {
  try {
    const clauses = [
      "i.status = 'open'",
      "c.verification_status = 'approved'",
    ];
    const values = [];

    if (req.query.kind === "job" || req.query.kind === "internship") {
      clauses.push("i.kind = ?");
      values.push(req.query.kind);
    }

    if (ALLOWED_DOMAINS.includes(req.query.domain)) {
      clauses.push("i.domain = ?");
      values.push(req.query.domain);
    }

    if (ALLOWED_WORK_TYPES.includes(req.query.work_type)) {
      clauses.push("i.work_type = ?");
      values.push(req.query.work_type);
    }

    const search = String(req.query.search || "").trim();
    if (search) {
      clauses.push("(i.title LIKE ? OR i.description LIKE ? OR i.skills LIKE ? OR c.company_name LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like, like);
    }

    const [internships] = await pool.execute(
      `SELECT i.id, i.kind, i.title, i.description, i.location, i.domain,
              i.work_type, i.skills, i.eligibility, i.stipend, i.duration,
              i.application_deadline, i.created_at, c.company_name
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY i.id DESC
       LIMIT 200`,
      values
    );

    res.json({ success: true, internships });
  } catch (error) {
    console.error("List internships:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch internships",
    });
  }
});

// Company creates an internship/job listing after approval.
// POST /api/internships  (kind: internship|job)
router.post("/", authenticate, requireRole("company"), async (req, res) => {
  try {
    const {
      title, description, location, stipend,
      duration, application_deadline,
      domain, work_type, skills, eligibility, kind,
    } = req.body;

    if (typeof title !== "string" || !title.trim() ||
        typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const workType = ALLOWED_WORK_TYPES.includes(work_type) ? work_type : null;
    const kindValue = kind === "job" ? "job" : "internship";

    const [companies] = await pool.execute(
      `SELECT id, verification_status FROM companies WHERE user_id = ?`,
      [req.user.id]
    );

    if (!companies.length) {
      return res.status(404).json({
        success: false,
        message: "Create your company profile first",
      });
    }

    if (companies[0].verification_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Company must be verified before posting opportunities",
      });
    }

    let stipendValue = 0;
    if (stipend !== undefined && stipend !== null && stipend !== "") {
      const parsed = Number(stipend);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({
          success: false,
          message: "Stipend must be a non-negative number or empty",
        });
      }
      stipendValue = parsed;
    }

    let deadline = null;
    if (application_deadline) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(application_deadline))) {
        return res.status(400).json({
          success: false,
          message: "Deadline date is invalid",
        });
      }
      deadline = application_deadline;
    }

    const [result] = await pool.execute(`
      INSERT INTO internships
        (company_id, title, description, location, stipend,
         duration, application_deadline, status, domain,
         work_type, skills, eligibility, kind)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)
    `, [
      companies[0].id,
      title.trim().slice(0, 200),
      description.trim(),
      typeof location === "string" && location.trim()
        ? location.trim().slice(0, 150) : null,
      stipendValue,
      typeof duration === "string" && duration.trim()
        ? duration.trim().slice(0, 100) : null,
      deadline,
      ALLOWED_DOMAINS.includes(domain) ? domain : "IT",
      workType,
      typeof skills === "string" && skills.trim()
        ? skills.trim().slice(0, 500) : null,
      typeof eligibility === "string" && eligibility.trim()
        ? eligibility.trim().slice(0, 300) : null,
      kindValue,
    ]);

    res.status(201).json({
      success: true,
      message: kindValue === "job"
        ? "Job opening published"
        : "Internship published",
      internship_id: result.insertId,
    });
  } catch (error) {
    console.error("Create internship:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to create listing",
    });
  }
});

// Listing open/closed state changes for the owning company
// PATCH /api/internships/:id/status
router.patch("/:id/status", authenticate, requireRole("company"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be open or closed",
      });
    }

    const listItem = Number(req.params.id);
    if (!Number.isSafeInteger(listItem) || listItem < 1) {
      return res.status(400).json({ success: false, message: "Invalid listing id" });
    }

    const [result] = await pool.execute(
      `UPDATE internships i
       JOIN companies c ON c.id = i.company_id
       SET i.status = ?
       WHERE i.id = ? AND c.user_id = ?`,
      [status, listItem, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Listing not found for your company",
      });
    }

    res.json({ success: true, message: `Listing marked ${status}` });
  } catch (error) {
    console.error("Listing status:", error.message);
    res.status(500).json({ success: false, message: "Unable to update listing" });
  }
});

// Company views its own listings (all statuses)
router.get("/my", authenticate, requireRole("company"), async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, c.company_name
      FROM internships i
      JOIN companies c ON c.id = i.company_id
      WHERE c.user_id = ?
      ORDER BY i.id DESC
    `, [req.user.id]);

    res.json({ success: true, internships: rows });
  } catch (error) {
    console.error("Company internships:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch company internships",
    });
  }
});

// Company edits its own listing (any status)
// PUT /api/internships/:id
router.put("/:id", authenticate, requireRole("company"), async (req, res) => {
  try {
    const listItem = Number(req.params.id);
    if (!Number.isSafeInteger(listItem) || listItem < 1) {
      return res.status(400).json({ success: false, message: "Invalid listing id" });
    }

    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) {
        return res.status(400).json({ success: false, message: "Title cannot be empty" });
      }
      updates.push("title = ?");
      values.push(req.body.title.trim().slice(0, 200));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      if (typeof req.body.description !== "string" || !req.body.description.trim()) {
        return res.status(400).json({ success: false, message: "Description cannot be empty" });
      }
      updates.push("description = ?");
      values.push(req.body.description.trim());
    }

    const optionalText = {
      location: 150, duration: 100, skills: 500, eligibility: 300,
    };
    for (const [field, maxLen] of Object.entries(optionalText)) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
      if (req.body[field] !== null && typeof req.body[field] !== "string") {
        return res.status(400).json({ success: false, message: `${field} must be text` });
      }
      updates.push(`${field} = ?`);
      values.push(req.body[field] && req.body[field].trim()
        ? req.body[field].trim().slice(0, maxLen) : null);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "work_type")) {
      if (req.body.work_type && !ALLOWED_WORK_TYPES.includes(req.body.work_type)) {
        return res.status(400).json({ success: false, message: "Invalid work type" });
      }
      updates.push("work_type = ?");
      values.push(req.body.work_type || null);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "domain")) {
      if (!ALLOWED_DOMAINS.includes(req.body.domain)) {
        return res.status(400).json({ success: false, message: "Domain must be IT or Non-IT" });
      }
      updates.push("domain = ?");
      values.push(req.body.domain);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "stipend")) {
      if (req.body.stipend !== null && req.body.stipend !== "") {
        const parsed = Number(req.body.stipend);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return res.status(400).json({ success: false, message: "Stipend must be a non-negative number or empty" });
        }
        updates.push("stipend = ?");
        values.push(parsed);
      } else {
        updates.push("stipend = 0");
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "application_deadline")) {
      if (req.body.application_deadline) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.application_deadline))) {
          return res.status(400).json({ success: false, message: "Deadline date is invalid" });
        }
        updates.push("application_deadline = ?");
        values.push(req.body.application_deadline);
      } else {
        updates.push("application_deadline = NULL");
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least one field to update" });
    }

    values.push(listItem, req.user.id);

    const [result] = await pool.execute(
      `UPDATE internships i
       JOIN companies c ON c.id = i.company_id
       SET ${updates.join(", ")}
       WHERE i.id = ? AND c.user_id = ?`,
      values
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Listing not found for your company" });
    }

    res.json({ success: true, message: "Listing updated" });
  } catch (error) {
    console.error("Edit internship:", error.message);
    res.status(500).json({ success: false, message: "Unable to update listing" });
  }
});

// Company deletes its own listing (draft or closed only)
router.delete("/:id", authenticate, requireRole("company"), async (req, res) => {
  try {
    const listItem = Number(req.params.id);
    if (!Number.isSafeInteger(listItem) || listItem < 1) {
      return res.status(400).json({ success: false, message: "Invalid listing id" });
    }

    const [result] = await pool.execute(
      `DELETE FROM internships i
       USING internships i
       JOIN companies c ON c.id = i.company_id
       WHERE i.id = ? AND c.user_id = ? AND i.status IN ('open', 'closed')`,
      [listItem, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Listing not found for your company",
      });
    }

    res.json({ success: true, message: "Listing removed" });
  } catch (error) {
    console.error("Delete internship:", error.message);
    res.status(500).json({ success: false, message: "Unable to delete listing" });
  }
});

// View one open internship
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid listing id" });
    }

    const [rows] = await pool.execute(`
      SELECT i.id, i.kind, i.title, i.description, i.location, i.domain,
             i.work_type, i.skills, i.eligibility, i.stipend, i.duration,
             i.application_deadline, i.created_at, c.company_name
      FROM internships i
      JOIN companies c ON c.id = i.company_id
      WHERE i.id = ?
        AND i.status = 'open'
        AND c.verification_status = 'approved'
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    res.json({ success: true, internship: rows[0] });
  } catch (error) {
    console.error("Get internship:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch internship",
    });
  }
});

module.exports = router;
