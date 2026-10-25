
const pool = require("./db");

async function testDatabase() {
  try {
    const [rows] = await pool.query("SELECT DATABASE() AS database_name");
    console.log("Database connected successfully:", rows[0].database_name);

    const [tables] = await pool.query("SHOW TABLES");
    console.log("Tables found:", tables.length);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();
