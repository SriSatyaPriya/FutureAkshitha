const express = require("express");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

// Authenticated user lists their own notifications
router.get("/my", authenticate, requireRole("student", "company", "admin"), async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      `SELECT id, type, title, body, link, read_at, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY id DESC LIMIT 50`,
      [req.user.id]
    );

    const unread = notifications.filter((item) => !item.read_at).length;

    res.json({ success: true, notifications, unread });
  } catch (error) {
    console.error("Get notifications:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
});

// Mark all notifications as read
router.post("/read-all", authenticate, requireRole("student", "company", "admin"), async (req, res) => {
  try {
    await pool.execute(
      "UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL",
      [req.user.id]
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark notifications read:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
});

module.exports = router;
