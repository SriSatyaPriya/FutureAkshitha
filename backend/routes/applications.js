const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

// Company application stages - lowercase strings stored in an enum column.
const APPLICATION_STAGES = [
  "applied", "shortlisted", "interview", "selected",
  "joined", "completed", "rejected", "withdrawn",
];

// Which stages can follow which (server-side transition rules).
const VALID_TRANSITIONS = {
  applied: ["shortlisted", "interview", "rejected"],
  shortlisted: ["interview", "selected", "rejected"],
  interview: ["selected", "rejected"],
  selected: ["joined", "rejected"],
  joined: ["completed"],
  completed: [],
  rejected: [],
  withdrawn: [],
};

// Student applies for an open internship or job
router.post("/", authenticate, requireRole("student"), async (req, res) => {
  try {
    const internshipId = Number(req.body.internship_id);
    const kind = req.body.kind === "job" ? "job" : "internship";

    if (!Number.isInteger(internshipId) || internshipId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid internship_id is required",
      });
    }

    const [internships] = await pool.execute(
      `SELECT i.id, i.title
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?
         AND i.status = 'open'
         AND i.kind = ?
         AND c.verification_status = 'approved'
         AND (i.application_deadline IS NULL
              OR i.application_deadline >= CURDATE())`,
      [internshipId, kind]
    );

    if (!internships.length) {
      return res.status(404).json({
        success: false,
        message: "Open opportunity not found or deadline passed",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO applications (student_id, internship_id, status)
       VALUES (?, ?, 'applied')`,
      [req.user.id, internshipId]
    );

    notify(
      req.user.id,
      "application",
      `Application submitted: ${internships[0].title}`,
      "The company has received your internship application.",
      "/student-dashboard"
    );

    return res.status(201).json({
      success: true,
      message: kind === "job"
        ? "Job application submitted"
        : "Internship application submitted",
      application: {
        id: result.insertId,
        student_id: req.user.id,
        internship_id: internshipId,
        status: "applied",
      },
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this internship",
      });
    }
    console.error("Apply for internship:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to submit application",
    });
  }
});

// Student views their own applications
router.get("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    const [applications] = await pool.execute(
      `SELECT a.id, a.status, a.applied_at,
              i.id AS internship_id, i.title, i.location, i.domain,
              i.work_type, i.stipend, i.duration, i.kind,
              c.company_name
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.student_id = ?
       ORDER BY a.id DESC`,
      [req.user.id]
    );

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Get student applications:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch applications",
    });
  }
});

// Student withdraws an application while still in "applied"
router.delete("/my/:id", authenticate, requireRole("student"), async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ success: false, message: "Invalid application id" });
    }

    const [result] = await pool.execute(
      `DELETE FROM applications
       WHERE id = ? AND student_id = ? AND status = 'applied'`,
      [applicationId, req.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Application not found, or it can no longer be withdrawn",
      });
    }

    res.json({ success: true, message: "Application withdrawn" });
  } catch (error) {
    console.error("Withdraw application:", error.message);
    res.status(500).json({ success: false, message: "Unable to withdraw application" });
  }
});

// Company views applications for its own internships only
router.get("/company", authenticate, requireRole("company"), async (req, res) => {
  try {
    const [applications] = await pool.execute(
      `SELECT a.id, a.status, a.applied_at,
              i.id AS internship_id, i.title, i.location, i.domain,
              i.work_type, i.duration, i.kind,
              u.id AS student_id, u.full_name, u.email, u.phone
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       JOIN users u ON u.id = a.student_id
       WHERE c.user_id = ?
       ORDER BY a.id DESC`,
      [req.user.id]
    );

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Get company applications:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch company applications",
    });
  }
});

// Company views the student profile + application detail for its own applicant
// GET /api/applications/company/:id
router.get("/company/:id", authenticate, requireRole("company"), async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ success: false, message: "Invalid application id" });
    }

    const [rows] = await pool.execute(
      `SELECT a.id, a.status, a.applied_at,
              i.id AS internship_id, i.title, i.kind,
              u.id AS student_id, u.full_name, u.email, u.phone,
              u.education, u.college, u.course, u.branch, u.domain,
              u.skills, u.graduation_year, u.cgpa
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       JOIN users u ON u.id = a.student_id
       WHERE a.id = ? AND c.user_id = ?`,
      [applicationId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Application not found for your company",
      });
    }

    res.json({ success: true, application: rows[0] });
  } catch (error) {
    console.error("Company applicant detail:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch applicant details" });
  }
});

// Company updates the status of an application for its own internship
router.patch(
  "/:id/status",
  authenticate,
  requireRole("company"),
  async (req, res) => {
    const connection = await pool.getConnection();
    try {
      const { status } = req.body;

      if (!APPLICATION_STAGES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application status",
        });
      }

      const applicationId = Number(req.params.id);
      if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid application id",
        });
      }

      await connection.beginTransaction();

      // Lock the application and verify company ownership server-side.
      const [rows] = await connection.execute(
        `SELECT a.id, a.status, a.student_id, i.title
         FROM applications a
         JOIN internships i ON i.id = a.internship_id
         JOIN companies c ON c.id = i.company_id
         WHERE a.id = ? AND c.user_id = ?
         FOR UPDATE`,
        [applicationId, req.user.id]
      );

      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Application not found for your company",
        });
      }

      const current = rows[0];
      const allowed = VALID_TRANSITIONS[current.status] || [];

      if (!allowed.includes(status)) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: `Cannot move an application from "${current.status}" to "${status}". Allowed next stages: ${allowed.join(", ") || "none"}`,
        });
      }

      await connection.execute(
        "UPDATE applications SET status = ? WHERE id = ?",
        [status, applicationId]
      );

      await connection.execute(
        `INSERT INTO application_status_history
         (application_id, from_status, to_status, changed_by)
         VALUES (?, ?, ?, ?)`,
        [applicationId, current.status, status, req.user.id]
      );

      await connection.commit();

      notify(
        current.student_id,
        "application",
        `Application status updated: ${rows[0].title}`,
        `Your application is now in the "${status}" stage.`,
        "/student-dashboard"
      );

      res.json({
        success: true,
        message: `Application status updated to ${status}`,
        status,
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        /* connection may already be closed */
      }
      console.error("Update application status:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to update application status",
      });
    } finally {
      connection.release();
    }
  }
);

// Student views the stage history of one of their own applications
router.get("/my/:id/history", authenticate, requireRole("student"), async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
      return res.status(400).json({ success: false, message: "Invalid application id" });
    }

    const [history] = await pool.execute(
      `SELECT h.from_status, h.to_status, h.created_at
       FROM application_status_history h
       JOIN applications a ON a.id = h.application_id
       WHERE h.application_id = ? AND a.student_id = ?
       ORDER BY h.id ASC`,
      [applicationId, req.user.id]
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error("Application history:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch history" });
  }
});

module.exports = router;
