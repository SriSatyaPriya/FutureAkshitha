
const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Student requests a free demo session for a course
// POST /api/courses/:id/demo
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

// Administrator views demo bookings
// GET /api/courses/demo-bookings (admin)
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

// Administrator updates a demo booking status
// PATCH /api/courses/demo-bookings/:id
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

// Get all active courses
router.get("/", async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT id, title, description, domain, duration, fee, status
       FROM courses
       WHERE status = 'active'
       ORDER BY id DESC`
    );

    res.json({ success: true, courses });
  } catch (error) {
    console.error("Get courses error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch courses"
    });
  }
});

// Get one course
router.get("/:id", async (req, res) => {
  try {
    const [courses] = await pool.execute(
      `SELECT id, title, description, domain, duration, fee, status
       FROM courses WHERE id = ? AND status = 'active'`,
      [req.params.id]
    );

    if (!courses.length) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.json({ success: true, course: courses[0] });
  } catch (error) {
    console.error("Get course error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch course"
    });
  }
});

module.exports = router;
