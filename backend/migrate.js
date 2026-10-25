// Adds any missing tables/columns. Safe to re-run; never drops existing data.
require("dotenv").config();
const pool = require("./db");

async function columnExists(table, column) {
  const [cols] = await pool.query(
    `SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return cols.length > 0;
}

async function addColumnIfMissing(table, definition) {
  const column = definition.split(" ")[0];
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    console.log(`+ column ${table}.${column}`);
  }
}

async function main() {
  await pool.query([
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(20) NULL,
      organization VARCHAR(200) NULL,
      enquiry_type VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: contact_messages");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS learning_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      activity_key VARCHAR(64) NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_activity (student_id, activity_key),
      CONSTRAINT learning_progress_ibfk FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: learning_progress");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS placement_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL UNIQUE,
      plan VARCHAR(30) NULL,
      status ENUM('not_submitted','pending','approved','needs_resubmission','rejected')
        DEFAULT 'not_submitted',
      payment_status ENUM('unpaid','paid') DEFAULT 'unpaid',
      reviewer_note VARCHAR(500) NULL,
      reviewed_at TIMESTAMP NULL,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT placement_enrollments_ibfk FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: placement_enrollments");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS document_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL UNIQUE,
      education VARCHAR(50) NULL,
      certificate_id VARCHAR(80) NULL,
      certificate_original_name VARCHAR(255) NULL,
      resume_id VARCHAR(80) NULL,
      resume_original_name VARCHAR(255) NULL,
      status ENUM('not_submitted','pending','approved','needs_resubmission','rejected')
        DEFAULT 'not_submitted',
      reviewer_note VARCHAR(500) NULL,
      reviewed_at TIMESTAMP NULL,
      submitted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT document_submissions_ibfk FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: document_submissions");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(200) NOT NULL,
      body VARCHAR(500) NULL,
      link VARCHAR(255) NULL,
      read_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_notifications_user (user_id),
      CONSTRAINT notifications_ibfk FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: notifications");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS application_status_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      application_id INT NOT NULL,
      from_status VARCHAR(30) NULL,
      to_status VARCHAR(30) NOT NULL,
      changed_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_ash_application (application_id),
      CONSTRAINT application_status_history_ibfk FOREIGN KEY (application_id)
        REFERENCES applications (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: application_status_history");

  await addColumnIfMissing("internships", "domain VARCHAR(30) DEFAULT 'IT'");
  await addColumnIfMissing("internships", "work_type VARCHAR(20) NULL");
  await addColumnIfMissing("internships", "skills VARCHAR(500) NULL");
  await addColumnIfMissing("internships", "eligibility VARCHAR(300) NULL");
  await addColumnIfMissing("internships", "kind ENUM('internship','job') DEFAULT 'internship'");
  await addColumnIfMissing("companies", "reviewer_note VARCHAR(500) NULL");
  await addColumnIfMissing("companies", "reviewed_at TIMESTAMP NULL");

  // Student academic profile fields (Part 2 requirements)
  await addColumnIfMissing("users", "college VARCHAR(200) NULL");
  await addColumnIfMissing("users", "course VARCHAR(120) NULL");
  await addColumnIfMissing("users", "branch VARCHAR(120) NULL");
  await addColumnIfMissing("users", "graduation_year SMALLINT NULL");
  await addColumnIfMissing("users", "cgpa DECIMAL(4,2) NULL");
  await addColumnIfMissing("users", "skills VARCHAR(500) NULL");
  await addColumnIfMissing("users", "education VARCHAR(50) NULL");
  await addColumnIfMissing("users", "domain VARCHAR(30) NULL");
  await addColumnIfMissing("users", "account_status ENUM('active','suspended') DEFAULT 'active'");
  console.log("ok: student profile columns");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      source ENUM('course','internship') NOT NULL,
      source_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      certificate_no VARCHAR(40) NOT NULL,
      note VARCHAR(300) NULL,
      issued_by INT NULL,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_certificate (student_id, source, source_id),
      UNIQUE KEY unique_certificate_no (certificate_no),
      CONSTRAINT certificates_ibfk FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: certificates");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS partnerships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      college_name VARCHAR(200) NOT NULL,
      status ENUM('proposed','active','ended') DEFAULT 'proposed',
      note VARCHAR(300) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_partnership (company_id, college_name),
      CONSTRAINT partnerships_ibfk FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: partnerships");

  await pool.query([
    `CREATE TABLE IF NOT EXISTS demo_bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      course_id INT NOT NULL,
      status ENUM('requested','scheduled','cancelled') DEFAULT 'requested',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_demo_booking (student_id, course_id),
      CONSTRAINT demo_bookings_student_fk FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT demo_bookings_course_fk FOREIGN KEY (course_id)
        REFERENCES courses (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ].join("; "));
  console.log("ok: demo_bookings");

  // Foreign keys for the pre-existing core tables (added only if absent)
  async function foreignKeyExists(table, name) {
    const [rows] = await pool.query(
      `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [table, name]
    );
    return rows.length > 0;
  }

  const foreignKeys = [
    // [table, constraint name, ALTER def]
    ["applications", "applications_student_fk",
      "ADD CONSTRAINT applications_student_fk FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE"],
    ["applications", "applications_internship_fk",
      "ADD CONSTRAINT applications_internship_fk FOREIGN KEY (internship_id) REFERENCES internships (id) ON DELETE CASCADE"],
    ["internships", "internships_company_fk",
      "ADD CONSTRAINT internships_company_fk FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE"],
    ["companies", "companies_user_fk",
      "ADD CONSTRAINT companies_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE"],
    ["enrollments", "enrollments_student_fk",
      "ADD CONSTRAINT enrollments_student_fk FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE"],
    ["enrollments", "enrollments_course_fk",
      "ADD CONSTRAINT enrollments_course_fk FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE"],
  ];

  for (const [table, name, def] of foreignKeys) {
    try {
      if (!(await foreignKeyExists(table, name))) {
        await pool.query(`ALTER TABLE ${table} ${def}`);
        console.log(`+ fk ${table}.${name}`);
      }
    } catch (error) {
      console.warn(`skip fk ${table}.${name}: ${error.message}`);
    }
  }

  const [uniqueApplications] = await pool.query(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'applications' AND CONSTRAINT_NAME = 'unique_application'`
  );
  if (!uniqueApplications[0].length) {
    try {
      await pool.query(
        `ALTER TABLE applications ADD CONSTRAINT unique_application UNIQUE (student_id, internship_id)`
      );
      console.log("+ unique applications(student_id, internship_id)");
    } catch (error) {
      console.warn("skip unique application key:", error.message);
    }
  }

  console.log("Migration complete.");

  console.log("Migration complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error.code, error.message);
  process.exit(1);
});
