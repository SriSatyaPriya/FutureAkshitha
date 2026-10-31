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

  await addColumnIfMissing("courses", "credits INT NULL DEFAULT 0");
  console.log("ok: courses.credits column");

  // Catalogue metadata columns (added to existing courses table, never drops data).
  await addColumnIfMissing("courses", "item_type ENUM('course','internship','project') DEFAULT 'course'");
  await addColumnIfMissing("courses", "source_annexure VARCHAR(40) NULL");
  await addColumnIfMissing("courses", "source_category VARCHAR(100) NULL");
  await addColumnIfMissing("courses", "source_order INT NULL");
  await addColumnIfMissing("courses", "language VARCHAR(30) NULL");
  await addColumnIfMissing("courses", "vertical VARCHAR(100) NULL");
  await addColumnIfMissing("courses", "skills VARCHAR(500) NULL");
  await addColumnIfMissing("courses", "delivery_mode VARCHAR(100) NULL");
  await addColumnIfMissing("courses", "duration_hours INT NULL");
  await addColumnIfMissing("courses", "duration_weeks INT NULL");
  console.log("ok: catalogue metadata columns");

  // Widen status enum to support draft / published / archived (adds values, keeps existing).
  try {
    await pool.query(
      "ALTER TABLE courses MODIFY COLUMN status ENUM('active','inactive','draft','published','archived') DEFAULT 'published'"
    );
    console.log("ok: courses.status widened");
  } catch (error) {
    console.warn("skip status widen:", error.message);
  }

  // Unique key for idempotent re-seeding (never duplicates).
  const [uk] = await pool.query(
    `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'courses' AND CONSTRAINT_NAME = 'unique_catalogue_record'`
  );
  if (!uk[0]?.length) {
    try {
      await pool.query(
        `ALTER TABLE courses ADD CONSTRAINT unique_catalogue_record UNIQUE (source_annexure, source_order)`
      );
      console.log("+ unique courses(source_annexure, source_order)");
    } catch (error) {
      console.warn("skip unique catalogue key:", error.message);
    }
  }

  // Idempotent seed of all 161 catalogue records from Annexures A-D.
  const { RECORDS } = require("./catalogue-seed");
  if (RECORDS && RECORDS.length > 0) {
    const values = RECORDS.map((r) => [
      r.title,
      r.description,
      r.domain,
      r.duration,
      r.fee,
      r.credits,
      r.status,
      r.item_type,
      r.source_annexure,
      r.source_category,
      r.source_order,
      r.language,
      r.vertical,
      r.skills,
      r.delivery_mode,
      r.duration_hours,
      r.duration_weeks,
    ]);
    const placeholders = values.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
    const flat = values.flat();
    await pool.query(
      `INSERT IGNORE INTO courses (title, description, domain, duration, fee, credits, status, item_type, source_annexure, source_category, source_order, language, vertical, skills, delivery_mode, duration_hours, duration_weeks) VALUES ${placeholders}`,
      flat
    );
    console.log(`ok: seeded ${RECORDS.length} catalogue records`);
  }

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
