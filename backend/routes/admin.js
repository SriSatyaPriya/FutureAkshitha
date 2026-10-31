const express = require("express");
const path = require("path");
const fs = require("fs");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

const DOCUMENT_DIR = path.join(__dirname, "..", "private-documents");

function fileExistsOnDisk(storedName) {
  if (!storedName) return false;
  const safeName = path.basename(String(storedName));
  const filePath = path.join(DOCUMENT_DIR, safeName);
  if (!filePath.startsWith(DOCUMENT_DIR)) return false;
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

const requireAdmin = [
  authenticate,
  requireRole("admin"),
  (req, res, next) => next(),
];

// 1. Live platform statistics from MySQL
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.query(
      "SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'"
    );
    const [[{ totalCompanies }]] = await pool.query(
      "SELECT COUNT(*) AS totalCompanies FROM companies"
    );
    const [[{ pendingCompanies }]] = await pool.query(
      "SELECT COUNT(*) AS pendingCompanies FROM companies WHERE verification_status = 'pending'"
    );
    const [[{ totalCourses }]] = await pool.query(
      "SELECT COUNT(*) AS totalCourses FROM courses WHERE status = 'active'"
    );
    const [[{ totalEnrollments }]] = await pool.query(
      "SELECT COUNT(*) AS totalEnrollments FROM enrollments"
    );
    const [[{ pendingEnrollments }]] = await pool.query(
      "SELECT COUNT(*) AS pendingEnrollments FROM enrollments WHERE status = 'pending'"
    );
    const [[{ totalInternships }]] = await pool.query(
      "SELECT COUNT(*) AS totalInternships FROM internships"
    );
    const [[{ totalApplications }]] = await pool.query(
      "SELECT COUNT(*) AS totalApplications FROM applications"
    );

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        pendingCompanies,
        totalCourses,
        totalEnrollments,
        pendingEnrollments,
        totalInternships,
        totalApplications,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch admin statistics"
    });
  }
});

// 2. Registered Students list with enrollment & application counts
router.get("/students", requireAdmin, async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT u.id, u.full_name, u.email, u.phone, u.created_at, u.account_status,
             (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id) AS enrollment_count,
             (SELECT COUNT(*) FROM applications a WHERE a.student_id = u.id) AS application_count,
             ds.education AS document_education,
             ds.status AS document_status,
             ds.certificate_id, ds.certificate_original_name,
             ds.resume_id, ds.resume_original_name
      FROM users u
      LEFT JOIN document_submissions ds ON ds.student_id = u.id
      WHERE u.role = 'student'
      ORDER BY u.id ASC
    `);

    for (const student of students) {
      student.certificate_available = fileExistsOnDisk(student.certificate_id);
      student.resume_available = fileExistsOnDisk(student.resume_id);
      delete student.certificate_id;
      delete student.resume_id;
    }

    res.json({ success: true, students });
  } catch (error) {
    console.error("Admin students error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch students list"
    });
  }
});

// 3. Course Enrollments list with student and course details
router.get("/enrollments", requireAdmin, async (req, res) => {
  try {
    const [enrollments] = await pool.execute(`
      SELECT e.id, e.status, e.enrolled_at,
             u.id AS student_id, u.full_name AS student_name, u.email AS student_email, u.phone AS student_phone,
             c.id AS course_id, c.title AS course_title, c.domain AS course_domain, c.duration, c.fee, c.credits
      FROM enrollments e
      JOIN users u ON u.id = e.student_id
      JOIN courses c ON c.id = e.course_id
      ORDER BY e.id DESC
    `);

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error("Admin enrollments error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch enrollments"
    });
  }
});

// 4. Update Course Enrollment status (Approve, Reject, Complete)
router.patch("/enrollments/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "approved", "rejected", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be pending, approved, rejected, or completed"
      });
    }

    const [result] = await pool.execute(
      "UPDATE enrollments SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Enrollment record not found"
      });
    }

    const [rows] = await pool.execute(
      `SELECT e.student_id, c.title
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (rows.length) {
      const statusLabel = {
        approved: "approved",
        rejected: "rejected",
        completed: "completed",
        pending: "moved back to pending review",
      }[status];
      notify(
        rows[0].student_id,
        "enrollment",
        `Enrollment ${statusLabel}: ${rows[0].title}`,
        `Your course enrollment was ${statusLabel} by the administration.`,
        "/student-dashboard"
      );
    }

    res.json({
      success: true,
      message: `Enrollment marked as ${status} successfully`,
      status
    });
  } catch (error) {
    console.error("Admin update enrollment error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update enrollment status"
    });
  }
});

// 5. Internship Applications monitoring across ecosystem
router.get("/applications", requireAdmin, async (req, res) => {
  try {
    const [applications] = await pool.execute(`
      SELECT a.id, a.status, a.applied_at,
             u.id AS student_id, u.full_name AS student_name, u.email AS student_email, u.phone AS student_phone,
             i.id AS internship_id, i.title AS internship_title, i.location, i.stipend, i.duration,
             c.id AS company_id, c.company_name
      FROM applications a
      JOIN users u ON u.id = a.student_id
      JOIN internships i ON i.id = a.internship_id
      JOIN companies c ON c.id = i.company_id
      ORDER BY a.id DESC
    `);

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Admin applications error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch applications"
    });
  }
});

// 6. Companies list (all statuses: pending, approved, rejected)
router.get("/companies", requireAdmin, async (req, res) => {
  try {
    const [companies] = await pool.execute(`
      SELECT c.id, c.user_id, c.company_name, c.website, c.description,
             c.verification_status, c.reviewer_note, c.reviewed_at, c.created_at,
             u.full_name AS contact_person, u.email AS contact_email, u.phone,
             u.account_status
      FROM companies c
      JOIN users u ON u.id = c.user_id
      ORDER BY c.id DESC
    `);

    res.json({ success: true, companies });
  } catch (error) {
    console.error("Admin companies error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch companies"
    });
  }
});

// View companies awaiting verification (backward compatible)
router.get("/companies/pending", requireAdmin, async (req, res) => {
  try {
    const [companies] = await pool.execute(`
      SELECT id, company_name, website, description,
             verification_status, created_at
      FROM companies
      WHERE verification_status = 'pending'
      ORDER BY id DESC
    `);

    res.json({ success: true, companies });
  } catch (error) {
    console.error("Pending companies:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch pending companies"
    });
  }
});

// 7. Approve or reject a company
router.patch("/companies/:id/verification", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected"
      });
    }

    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 500) : null;
    if (status === "rejected" && !note) {
      return res.status(400).json({
        success: false,
        message: "A reason is required when rejecting a company"
      });
    }

    const [result] = await pool.execute(
      `UPDATE companies
       SET verification_status = ?, reviewer_note = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, note, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const [companies] = await pool.execute(
      "SELECT user_id, company_name FROM companies WHERE id = ?",
      [req.params.id]
    );

    if (companies.length) {
      notify(
        companies[0].user_id,
        "company",
        status === "approved"
          ? `Company verified: ${companies[0].company_name}`
          : `Company verification rejected`,
        status === "approved"
          ? "Your company account is approved. You can now post internships."
          : note || "Your company verification request was rejected. Please contact support.",
        "/company-dashboard"
      );
    }

    res.json({
      success: true,
      message: `Company ${status} successfully`,
      status
    });
  } catch (error) {
    console.error("Company verification:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update company verification"
    });
  }
});

// 8. Courses catalog management view
router.get("/courses", requireAdmin, async (req, res) => {
  try {
    const [courses] = await pool.execute(`
      SELECT c.id, c.title, c.description, c.domain, c.duration, c.fee, c.credits, c.status, c.item_type,
             c.source_annexure, c.source_category, c.source_order, c.language, c.vertical, c.skills,
             c.delivery_mode, c.duration_hours, c.duration_weeks, c.created_at,
             (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrollment_count
      FROM courses c
      ORDER BY c.id DESC
    `);

    res.json({ success: true, courses });
  } catch (error) {
    console.error("Admin courses error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch courses"
    });
  }
});


/**
 * Create a course
 * POST /api/admin/courses
 */
router.post("/courses", requireAdmin, async (req, res) => {
  try {
    const { title, description, domain, duration, fee, credits } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof domain !== "string" ||
      !domain.trim() ||
      typeof duration !== "string" ||
      !duration.trim() ||
      fee === undefined ||
      fee === null ||
      fee === "" ||
      !Number.isFinite(Number(fee)) ||
      Number(fee) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, domain, duration and a valid non-negative fee are required.",
      });
    }

    const creditsValue =
      credits === undefined || credits === null || credits === ""
        ? 0
        : Number(credits);
    if (!Number.isFinite(creditsValue) || creditsValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Credits must be a valid non-negative number.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO courses (title, description, domain, duration, fee, credits, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        title.trim(),
        typeof description === "string" ? description.trim() : "",
        domain.trim(),
        duration.trim(),
        Number(fee),
        creditsValue,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Course created successfully.",
      courseId: result.insertId,
    });
  } catch (error) {
    console.error("Admin create course error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create course.",
    });
  }
});

/**
 * Update a course
 * PATCH /api/admin/courses/:id
 */
router.patch("/courses/:id", requireAdmin, async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    const allowedFields = ["title", "description", "domain", "duration", "fee", "credits", "status"];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      const value = req.body[field];

      if (field === "fee") {
        if (
          value === "" ||
          value === null ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Fee must be a valid non-negative number.",
          });
        }
        updates.push("fee = ?");
        values.push(Number(value));
      } else if (field === "credits") {
        if (
          value === "" ||
          value === null ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: "Credits must be a valid non-negative number.",
          });
        }
        updates.push("credits = ?");
        values.push(Number(value));
      } else if (field === "status") {
        if (!["active", "inactive"].includes(value)) {
          return res.status(400).json({
            success: false,
            message: "Status must be active or inactive.",
          });
        }
        updates.push("status = ?");
        values.push(value);
      } else {
        if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text.`,
          });
        }

        if (["title", "domain", "duration"].includes(field) && !value.trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be empty.`,
          });
        }

        updates.push(`${field} = ?`);
        values.push(value.trim());
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one course field to update.",
      });
    }

    values.push(courseId);

    const [result] = await pool.execute(
      `UPDATE courses SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    if (!result.affectedRows) {
      const [existing] = await pool.execute(
        "SELECT id FROM courses WHERE id = ?",
        [courseId]
      );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message: "Course not found.",
        });
      }
    }

    return res.json({
      success: true,
      message: "Course updated successfully.",
    });
  } catch (error) {
    console.error("Admin update course error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update course.",
    });
  }
});

// 9. Suspend / reactivate a student account
// PATCH /api/admin/students/:id/status
router.patch("/students/:id/status", requireAdmin, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return res.status(400).json({ success: false, message: "Invalid student id" });
    }

    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or suspended",
      });
    }

    const [users] = await pool.execute(
      "SELECT id, full_name FROM users WHERE id = ? AND role = 'student'",
      [studentId]
    );
    if (!users.length) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await pool.execute("UPDATE users SET account_status = ? WHERE id = ?", [status, studentId]);

    res.json({
      success: true,
      message: `Student account ${status === "suspended" ? "suspended" : "reactivated"}`,
    });
  } catch (error) {
    console.error("Admin student status:", error.message);
    res.status(500).json({ success: false, message: "Unable to update student account" });
  }
});

// 10. Suspend / reactivate the company account behind a company profile
// PATCH /api/admin/companies/:id/status  (account_status, not verification)
router.patch("/companies/:id/status", requireAdmin, async (req, res) => {
  try {
    const companyId = Number(req.params.id);
    if (!Number.isSafeInteger(companyId) || companyId < 1) {
      return res.status(400).json({ success: false, message: "Invalid company id" });
    }

    const { status } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or suspended",
      });
    }

    const [companies] = await pool.execute(
      "SELECT id, user_id, company_name FROM companies WHERE id = ?",
      [companyId]
    );
    if (!companies.length) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    await pool.execute(
      "UPDATE users SET account_status = ? WHERE id = ?",
      [status, companies[0].user_id]
    );

    res.json({
      success: true,
      message: `Company account ${status === "suspended" ? "suspended" : "reactivated"}`,
    });
  } catch (error) {
    console.error("Admin company status:", error.message);
    res.status(500).json({ success: false, message: "Unable to update company account" });
  }
});

// 11. Company-college partnerships
// GET /api/admin/partnerships
router.get("/partnerships", requireAdmin, async (req, res) => {
  try {
    const [partnerships] = await pool.execute(
      `SELECT p.id, p.company_id, p.college_name, p.status, p.note, p.created_at,
              c.company_name
       FROM partnerships p
       JOIN companies c ON c.id = p.company_id
       ORDER BY p.id DESC`
    );

    res.json({ success: true, partnerships });
  } catch (error) {
    console.error("Admin partnerships:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch partnerships" });
  }
});

// POST /api/admin/partnerships
router.post("/partnerships", requireAdmin, async (req, res) => {
  try {
    const companyId = Number(req.body.company_id);
    const collegeName = typeof req.body.college_name === "string" ? req.body.college_name.trim().slice(0, 200) : "";

    if (!Number.isSafeInteger(companyId) || companyId < 1 || !collegeName) {
      return res.status(400).json({
        success: false,
        message: "A valid company and college name are required",
      });
    }

    const status = ["proposed", "active", "ended"].includes(req.body.status)
      ? req.body.status : "proposed";

    const [companies] = await pool.execute("SELECT id FROM companies WHERE id = ?", [companyId]);
    if (!companies.length) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    const [result] = await pool.execute(
      `INSERT INTO partnerships (company_id, college_name, status, note) VALUES (?, ?, ?, ?)`,
      [
        companyId,
        collegeName,
        status,
        typeof req.body.note === "string" ? req.body.note.trim().slice(0, 300) : null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Partnership recorded",
      partnershipId: result.insertId,
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This company-college partnership already exists",
      });
    }
    console.error("Create partnership:", error.message);
    res.status(500).json({ success: false, message: "Unable to record partnership" });
  }
});

// PATCH /api/admin/partnerships/:id
router.patch("/partnerships/:id", requireAdmin, async (req, res) => {
  try {
    const partnershipId = Number(req.params.id);
    if (!Number.isSafeInteger(partnershipId) || partnershipId < 1) {
      return res.status(400).json({ success: false, message: "Invalid partnership id" });
    }

    if (!["proposed", "active", "ended"].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be proposed, active, or ended",
      });
    }

    const note = typeof req.body.note === "string" ? req.body.note.trim().slice(0, 300) : null;

    const [result] = await pool.execute(
      "UPDATE partnerships SET status = ?, note = COALESCE(?, note) WHERE id = ?",
      [req.body.status, note, partnershipId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Partnership not found" });
    }

    res.json({ success: true, message: `Partnership marked ${req.body.status}` });
  } catch (error) {
    console.error("Update partnership:", error.message);
    res.status(500).json({ success: false, message: "Unable to update partnership" });
  }
});

module.exports = router;
