const pool = require("./db");

// Keyed on (user_id, type) with IGNORE so repeated status changes do not
// spam duplicate notifications with identical content.
async function notify(userId, type, title, body = null, link = null) {
  try {
    if (!userId || !Number.isInteger(Number(userId))) return;
    const id = Number(userId);
    // Skip if the user already has the same unread notification, so repeated
    // identical events do not spam the list.
    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, body, link)
       SELECT ?, ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM notifications
         WHERE user_id = ? AND title = ? AND read_at IS NULL
       )`,
      [id, type, title, body || null, link || null, id, title]
    );
  } catch (error) {
    console.error("notify error:", error.message);
  }
}

module.exports = { notify };
