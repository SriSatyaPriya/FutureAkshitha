
const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// ---------------------------------------------------------------------------
// Existing: Student requests a free demo session for a course
// POST /api/courses/:id/demo
// ---------------------------------------------------------------------------
router.post("/:id/demo", authenticate, requireRole("student"), async (req, res) => {
  try {
    const courseId = Number(req.params.id);

    if (!Number.isSafeInteger(courseId) || courseId < 1) {
      return res.status(400).json({ success: false, message: "Invalid course id" });
    }

    const [courses] = await pool.execute(
      "SELECT title FROM courses WHERE id = ? AND status = 'active'",
      [courseId]
    );

    if (!courses.length) {
      return res.status(404).json({ success: false, message: "Active course not found" });
    }

    try {
      await pool.execute(
        `INSERT IGNORE INTO demo_bookings (student_id, course_id) VALUES (?, ?)`,
        [req.user.id, courseId]
      );
    } catch (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: `Demo request received for "${courses[0].title}". Our team will confirm the schedule with you.`,
    });
  } catch (error) {
    console.error("Demo booking:", error.message);
    res.status(500).json({ success: false, message: "Unable to request demo" });
  }
});

// ---------------------------------------------------------------------------
// Existing: Administrator views demo bookings
// GET /api/courses/demo-bookings (admin)
// ---------------------------------------------------------------------------
router.get("/demo-bookings", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const [bookings] = await pool.execute(
      `SELECT d.id, d.status, d.created_at,
              u.id AS student_id, u.full_name, u.email, u.phone,
              c.title AS course_title, c.domain AS course_domain
       FROM demo_bookings d
       JOIN users u ON u.id = d.student_id
       JOIN courses c ON c.id = d.course_id
       ORDER BY d.id DESC`
    );

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("List demo bookings:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch demo bookings" });
  }
});

// ---------------------------------------------------------------------------
// Existing: Administrator updates a demo booking status
// PATCH /api/courses/demo-bookings/:id
// ---------------------------------------------------------------------------
router.patch("/demo-bookings/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
      return res.status(400).json({ success: false, message: "Invalid booking id" });
    }

    if (!["requested", "scheduled", "cancelled"].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be requested, scheduled, or cancelled",
      });
    }

    const [result] = await pool.execute(
      "UPDATE demo_bookings SET status = ? WHERE id = ?",
      [req.body.status, bookingId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: `Demo booking marked ${req.body.status}` });
  } catch (error) {
    console.error("Update demo booking:", error.message);
    res.status(500).json({ success: false, message: "Unable to update demo booking" });
  }
});

// ---------------------------------------------------------------------------
// PUBLIC: List published catalogue records with filters & pagination
// GET /api/courses
// Query: search, item_type, source_annexure, source_category, language,
//        vertical, credits, min_hours, max_hours, min_weeks, max_weeks,
//        status, page, limit
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const clauses = ["status = 'published'"];
    const values = [];

    const search = String(req.query.search || "").trim();
    if (search) {
      clauses.push("(title LIKE ? OR description LIKE ? OR skills LIKE ? OR vertical LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like, like);
    }

    if (req.query.item_type) {
      clauses.push("item_type = ?");
      values.push(req.query.item_type);
    }

    if (req.query.source_annexure) {
      clauses.push("source_annexure = ?");
      values.push(req.query.source_annexure);
    }

    if (req.query.source_category) {
      clauses.push("source_category = ?");
      values.push(req.query.source_category);
    }

    if (req.query.language) {
      clauses.push("language = ?");
      values.push(req.query.language);
    }

    if (req.query.vertical) {
      clauses.push("vertical = ?");
      values.push(req.query.vertical);
    }

    if (req.query.credits) {
      clauses.push("credits = ?");
      values.push(Number(req.query.credits));
    }

    if (req.query.min_hours) {
      clauses.push("duration_hours >= ?");
      values.push(Number(req.query.min_hours));
    }

    if (req.query.max_hours) {
      clauses.push("duration_hours <= ?");
      values.push(Number(req.query.max_hours));
    }

    if (req.query.min_weeks) {
      clauses.push("duration_weeks >= ?");
      values.push(Number(req.query.min_weeks));
    }

    if (req.query.max_weeks) {
      clauses.push("duration_weeks <= ?");
      values.push(Number(req.query.max_weeks));
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      `SELECT id, title, description, domain, duration, fee, credits, status,
              item_type, source_annexure, source_category, source_order, language,
              vertical, skills, delivery_mode, duration_hours, duration_weeks,
              created_at
       FROM courses
       WHERE ${clauses.join(" AND ")}
       ORDER BY source_order ASC, id ASC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM courses WHERE ${clauses.join(" AND ")}`,
      values
    );

    res.json({
      success: true,
      courses: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get courses error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch courses",
    });
  }
});

// ---------------------------------------------------------------------------
// PUBLIC: Get one published catalogue record by id
// GET /api/courses/:id
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT id, title, description, domain, duration, fee, credits, status,
              item_type, source_annexure, source_category, source_order, language,
              vertical, skills, delivery_mode, duration_hours, duration_weeks,
              created_at
       FROM courses WHERE id = ? AND status = 'published'`,
      [req.params.id]
    );

    if (!courses.length) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({ success: true, course: courses[0] });
  } catch (error) {
    console.error("Get course error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch course",
    });
  }
});

// ---------------------------------------------------------------------------
// ADMIN: Get all catalogue records (any status) with filters
// GET /api/courses/admin/all
// ---------------------------------------------------------------------------
router.get("/admin/all", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const clauses = [];
    const values = [];

    const search = String(req.query.search || "").trim();
    if (search) {
      clauses.push("(title LIKE ? OR description LIKE ? OR skills LIKE ?)");
      const like = `%${search}%`;
      values.push(like, like, like);
    }

    if (req.query.item_type) {
      clauses.push("item_type = ?");
      values.push(req.query.item_type);
    }

    if (req.query.source_annexure) {
      clauses.push("source_annexure = ?");
      values.push(req.query.source_annexure);
    }

    if (req.query.source_category) {
      clauses.push("source_category = ?");
      values.push(req.query.source_category);
    }

    if (req.query.language) {
      clauses.push("language = ?");
      values.push(req.query.language);
    }

    if (req.query.status) {
      clauses.push("status = ?");
      values.push(req.query.status);
    }

    const [rows] = await pool.execute(
      `SELECT id, title, description, domain, duration, fee, credits, status,
              item_type, source_annexure, source_category, source_order, language,
              vertical, skills, delivery_mode, duration_hours, duration_weeks,
              created_at
       FROM courses
       ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""}
       ORDER BY id DESC`
    );

    res.json({ success: true, courses: rows });
  } catch (error) {
    console.error("Admin all courses error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch courses" });
  }
});

// ---------------------------------------------------------------------------
// ADMIN: Create a new catalogue record
// POST /api/courses/admin
// ---------------------------------------------------------------------------
router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const {
      title, description, domain, duration, fee, credits,
      item_type, source_annexure, source_category, source_order, language,
      vertical, skills, delivery_mode, duration_hours, duration_weeks, status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const itemType = item_type || "course";
    const catalogueStatus = status || "draft";

    const [result] = await pool.execute(
      `INSERT INTO courses
        (title, description, domain, duration, fee, credits, status,
         item_type, source_annexure, source_category, source_order, language,
         vertical, skills, delivery_mode, duration_hours, duration_weeks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description || null,
        domain || null,
        duration || null,
        fee !== undefined && fee !== null && fee !== "" ? Number(fee) : null,
        credits !== undefined && credits !== null && credits !== "" ? Number(credits) : null,
        catalogueStatus,
        itemType,
        source_annexure || null,
        source_category || null,
        source_order !== undefined && source_order !== null ? Number(source_order) : null,
        language || null,
        vertical || null,
        skills || null,
        delivery_mode || null,
        duration_hours !== undefined && duration_hours !== null ? Number(duration_hours) : null,
        duration_weeks !== undefined && duration_weeks !== null ? Number(duration_weeks) : null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Catalogue record created successfully.",
      courseId: result.insertId,
    });
  } catch (error) {
    console.error("Admin create course error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create catalogue record." });
  }
});

// ---------------------------------------------------------------------------
// ADMIN: Update a catalogue record
// PATCH /api/courses/admin/:id
// ---------------------------------------------------------------------------
router.patch("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid course ID." });
    }

    const allowedFields = [
      "title", "description", "domain", "duration", "fee", "credits", "status",
      "item_type", "source_annexure", "source_category", "source_order", "language",
      "vertical", "skills", "delivery_mode", "duration_hours", "duration_weeks",
    ];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;
      let value = req.body[field];

      if (field === "title") {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json({ success: false, message: "Title cannot be empty" });
        }
        value = value.trim();
      }

      if (field === "fee" || field === "credits" || field === "duration_hours" || field === "duration_weeks" || field === "source_order") {
        if (value !== undefined && value !== null && value !== "") {
          const num = Number(value);
          if (!Number.isFinite(num) || num < 0) {
            return res.status(400).json({ success: false, message: `${field} must be a non-negative number` });
          }
          value = num;
        }
      }

      if (field === "status") {
        if (!["draft", "published", "archived", "active", "inactive"].includes(value)) {
          return res.status(400).json({ success: false, message: "Invalid status" });
        }
      }

      updates.push(`${field} = ?`);
      values.push(value);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "Provide at least one field to update" });
    }

    values.push(courseId);
    await pool.execute(`UPDATE courses SET ${updates.join(", ")} WHERE id = ?`, values);

    return res.json({ success: true, message: "Catalogue record updated successfully." });
  } catch (error) {
    console.error("Admin update course error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update catalogue record." });
  }
});

// ---------------------------------------------------------------------------
// ADMIN: Delete a catalogue record
// DELETE /api/courses/admin/:id
// ---------------------------------------------------------------------------
router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid course ID." });
    }

    const [result] = await pool.execute("DELETE FROM courses WHERE id = ?", [courseId]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    return res.json({ success: true, message: "Catalogue record deleted." });
  } catch (error) {
    console.error("Admin delete course error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to delete catalogue record." });
  }
});

module.exports = router;
