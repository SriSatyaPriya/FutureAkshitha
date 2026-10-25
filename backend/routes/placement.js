const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

const PLANS = ["Basic", "Standard", "Premium"];

// Student views their placement-training record
router.get("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT plan, status, payment_status, reviewer_note,
              reviewed_at, submitted_at, updated_at
       FROM placement_enrollments WHERE student_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      enrollment: rows[0] || null,
    });
  } catch (error) {
    console.error("Get placement:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch placement enrollment",
    });
  }
});

// Student selects / updates a plan. Payment is NOT recorded: payment_status
// only transitions to 'paid' through an administrator seeing a real receipt.
router.post("/plan", authenticate, requireRole("student"), async (req, res) => {
  try {
    const plan = typeof req.body.plan === "string" ? req.body.plan.trim() : "";

    if (!PLANS.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Plan must be Basic, Standard, or Premium",
      });
    }

    const [existing] = await pool.execute(
      "SELECT status FROM placement_enrollments WHERE student_id = ?",
      [req.user.id]
    );

    const status = existing.length ? existing[0].status : null;

    if (status === "approved") {
      await pool.execute(
        "UPDATE placement_enrollments SET plan = ? WHERE student_id = ?",
        [plan, req.user.id]
      );

      return res.json({
        success: true,
        message: `Plan updated to ${plan}. Your enrollment remains approved.`,
      });
    }

    await pool.execute(
      `INSERT INTO placement_enrollments (student_id, plan)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE plan = VALUES(plan)`,
      [req.user.id, plan]
    );

    res.json({
      success: true,
      message: `Your ${plan} plan has been saved. Continue to enrollment verification.`,
    });
  } catch (error) {
    console.error("Save placement plan:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to save your plan",
    });
  }
});

module.exports = router;
