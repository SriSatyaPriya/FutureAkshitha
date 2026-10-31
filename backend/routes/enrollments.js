
const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

// Enroll the logged-in student in a course
router.post("/", [authenticate, requireRole("student")], async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!Number.isInteger(course_id) || course_id < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid numeric course_id is required"
      });
    }

    const [courses] = await pool.execute(
      "SELECT id FROM courses WHERE id = ? AND status = 'active'",
      [course_id]
    );

    if (!courses.length) {
      return res.status(404).json({
        success: false,
        message: "Active course not found"
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
      [req.user.id, course_id]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "Already enrolled in this course"
      });
    }

    const [result] = await pool.execute(
      "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
      [req.user.id, course_id]
    );

    return res.status(201).json({
      success: true,
      message: "Course enrollment submitted",
      enrollment: {
        id: result.insertId,
        student_id: req.user.id,
        course_id,
        status: "pending"
      }
    });
  } catch (error) {
    console.error("Enrollment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to enroll in course"
    });
  }
});

// Get the logged-in student's enrollments
router.get("/my", [authenticate, requireRole("student")], async (req, res) => {
  try {
    const [enrollments] = await pool.execute(
      `SELECT e.id, e.student_id, e.status, e.enrolled_at,
               c.id AS course_id, c.title, c.domain, c.duration, c.fee, c.credits
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.id DESC`,
      [req.user.id]
    );

    res.json({ success: true, enrollments });
  } catch (error) {
    console.error("Get enrollments error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch enrollments"
    });
  }
});

module.exports = router;
