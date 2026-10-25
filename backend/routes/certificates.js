const express = require("express");
const crypto = require("crypto");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

// Student views their own certificates
// GET /api/certificates/my
router.get("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    const [certificates] = await pool.execute(
      `SELECT id, source, source_id, title, certificate_no, note, issued_at
       FROM certificates WHERE student_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );

    res.json({ success: true, certificates });
  } catch (error) {
    console.error("Student certificates:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch certificates" });
  }
});

// Admin lists certificates (optionally filtered by student)
// GET /api/certificates?student_id=
router.get("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const clauses = [];
    const values = [];

    if (req.query.student_id) {
      const studentId = Number(req.query.student_id);
      if (!Number.isSafeInteger(studentId) || studentId < 1) {
        return res.status(400).json({ success: false, message: "Invalid student id" });
      }
      clauses.push("c.student_id = ?");
      values.push(studentId);
    }

    const [certificates] = await pool.execute(
      `SELECT c.id, c.source, c.source_id, c.title, c.certificate_no, c.note, c.issued_at,
              u.id AS student_id, u.full_name, u.email
       FROM certificates c
       JOIN users u ON u.id = c.student_id
       ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""}
       ORDER BY c.id DESC`,
      values
    );

    res.json({ success: true, certificates });
  } catch (error) {
    console.error("Admin certificates list:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch certificates" });
  }
});

// Administrator issues a certificate. Only allowed once the matching
// completion condition is satisfied:
//  - source=course      -> enrollments.status = 'completed' for student+course
//  - source=internship  -> applications.status = 'completed' for student+internship
// POST /api/certificates
router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const studentId = Number(req.body.student_id);
    const source = req.body.source;
    const sourceId = Number(req.body.source_id);

    if (!["course", "internship"].includes(source)) {
      return res.status(400).json({
        success: false,
        message: "Source must be course or internship",
      });
    }
    if (!Number.isSafeInteger(studentId) || studentId < 1 ||
        !Number.isSafeInteger(sourceId) || sourceId < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid student_id and source_id are required",
      });
    }

    // Verify completion condition + collect a sensible default title
    let title = typeof req.body.title === "string" ? req.body.title.trim().slice(0, 200) : "";
    let defaultTitle;

    if (source === "course") {
      const [rows] = await pool.execute(
        `SELECT c.title, u.id AS student_id
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         JOIN users u ON u.id = e.student_id
         WHERE e.student_id = ? AND e.course_id = ? AND e.status = 'completed'`,
        [studentId, sourceId]
      );
      if (!rows.length) {
        return res.status(409).json({
          success: false,
          message:
            "Certificate cannot be issued: the student's enrollment for this course is not completed.",
        });
      }
      defaultTitle = `Certificate of Completion - ${rows[0].title}`;
    } else {
      const [rows] = await pool.execute(
        `SELECT i.title, i.kind, u.id AS student_id, c.company_name
         FROM applications a
         JOIN internships i ON i.id = a.internship_id
         JOIN users u ON u.id = a.student_id
         JOIN companies c ON c.id = i.company_id
         WHERE a.student_id = ? AND a.internship_id = ? AND a.status = 'completed'`,
        [studentId, sourceId]
      );
      if (!rows.length) {
        return res.status(409).json({
          success: false,
          message:
            "Certificate cannot be issued: the application for this internship is not in the completed stage.",
        });
      }
      defaultTitle = `${rows[0].kind === "job" ? "Job" : "Internship"} Completion Certificate - ${rows[0].title} (${rows[0].company_name})`;
    }

    if (!title) title = defaultTitle;

    const certificateNo = `FA-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    try {
      const [result] = await pool.execute(
        `INSERT INTO certificates
          (student_id, source, source_id, title, certificate_no, note, issued_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          source,
          sourceId,
          title,
          certificateNo,
          typeof req.body.note === "string" ? req.body.note.trim().slice(0, 300) : null,
          req.user.id,
        ]
      );

      notify(
        studentId,
        "certificate",
        `Certificate issued: ${title}`,
        `Certificate number ${certificateNo} is now available on your dashboard.`,
        "/student-dashboard"
      );

      res.status(201).json({
        success: true,
        message: "Certificate issued",
        certificate: {
          id: result.insertId,
          title,
          certificate_no: certificateNo,
        },
      });
    } catch (error) {
      if (error && error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "A certificate for this record has already been issued",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Issue certificate:", error.message);
    res.status(500).json({ success: false, message: "Unable to issue certificate" });
  }
});

// Administrator revokes a certificate (compliance / wrong issuance)
// DELETE /api/certificates/:id
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const certificateId = Number(req.params.id);
    if (!Number.isSafeInteger(certificateId) || certificateId < 1) {
      return res.status(400).json({ success: false, message: "Invalid certificate id" });
    }

    const [result] = await pool.execute(
      "DELETE FROM certificates WHERE id = ?",
      [certificateId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({ success: true, message: "Certificate revoked" });
  } catch (error) {
    console.error("Revoke certificate:", error.message);
    res.status(500).json({ success: false, message: "Unable to revoke certificate" });
  }
});

module.exports = router;
