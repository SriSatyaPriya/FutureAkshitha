const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

const ACTIVITY_KEY = /^[1-6]-[0-9]{1,2}$/;

// Student views their own learning-journey progress
router.get("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT activity_key, completed_at FROM learning_progress WHERE student_id = ?",
      [req.user.id]
    );

    res.json({
      success: true,
      progress: rows.map((row) => ({
        key: row.activity_key,
        completedAt: row.completed_at,
      })),
    });
  } catch (error) {
    console.error("Get learning progress:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch learning progress",
    });
  }
});

// Student marks one activity complete or incomplete by its key "month-index"
router.put("/activity", authenticate, requireRole("student"), async (req, res) => {
  try {
    const key = String(req.body.key || "");

    if (!ACTIVITY_KEY.test(key)) {
      return res.status(400).json({
        success: false,
        message: "Activity key must be in the form month-index, e.g. 3-1",
      });
    }

    const complete = req.body.complete;

    if (complete) {
      await pool.execute(
        `INSERT IGNORE INTO learning_progress (student_id, activity_key)
         VALUES (?, ?)`,
        [req.user.id, key]
      );
    } else {
      await pool.execute(
        "DELETE FROM learning_progress WHERE student_id = ? AND activity_key = ?",
        [req.user.id, key]
      );
    }

    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS completed FROM learning_progress WHERE student_id = ?",
      [req.user.id]
    );

    res.json({
      success: true,
      completed: rows[0].completed,
    });
  } catch (error) {
    console.error("Update learning progress:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update learning progress",
    });
  }
});

// Student clears their own progress
router.delete("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    await pool.execute(
      "DELETE FROM learning_progress WHERE student_id = ?",
      [req.user.id]
    );

    res.json({ success: true, message: "Your learning checklist has been reset." });
  } catch (error) {
    console.error("Reset learning progress:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to reset learning progress",
    });
  }
});

module.exports = router;
