const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");
const { notify } = require("../notify");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "private-documents");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
// Hard-error if the folder ends up inside the frontend public path by mistake.
if (UPLOAD_DIR.includes(`${path.sep}frontend${path.sep}`)) {
  throw new Error("private-documents must not be inside the frontend public tree");
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = {
  certificate: new Set([".pdf", ".jpg", ".jpeg", ".png"]),
  resume: new Set([".pdf", ".doc", ".docx"]),
};

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomBytes(20).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE, files: 2 },
  fileFilter: (req, file, cb) => {
    const allowed = ALLOWED_EXTENSIONS[file.fieldname];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed || !allowed.has(ext)) {
      return cb(
        new Error(
          `Invalid file for "${file.fieldname}". Allowed: ${
            allowed ? [...allowed].join(", ") : "no such field"
          }`
        )
      );
    }
    cb(null, true);
  },
});

const fields = upload.fields([
  { name: "certificate", maxCount: 1 },
  { name: "resume", maxCount: 1 },
]);

const EDUCATION_OPTIONS = [
  "10th", "12th", "Intermediate", "Diploma", "Degree", "Graduate", "Postgraduate",
];

function cleanup(uploaded) {
  for (const file of uploaded) {
    try {
      fs.rmSync(file.path, { force: true });
    } catch (error) {
      console.error("Cleanup error:", error.message);
    }
  }
}

// Student submits education details + certificate/resume files
router.post(
  "/submit",
  authenticate,
  requireRole("student"),
  fields,
  async (req, res, next) => {
    const uploaded = [].concat(req.files?.certificate || [], req.files?.resume || []);

    try {
      const education =
        typeof req.body.education === "string"
          ? req.body.education.trim().slice(0, 50)
          : "";

      if (!EDUCATION_OPTIONS.includes(education)) {
        cleanup(uploaded);
        return res.status(400).json({
          success: false,
          message: "Select your highest education",
        });
      }

      const certificate = (req.files?.certificate || [])[0];
      const resume = (req.files?.resume || [])[0];

      if (!certificate || !resume) {
        cleanup(uploaded);
        return res.status(400).json({
          success: false,
          message:
            "Both a completion certificate and a resume are required. Accepted: certificate (PDF/JPG/PNG), resume (PDF/DOC/DOCX), max 5 MB each.",
        });
      }

      const [existing] = await pool.execute(
        "SELECT certificate_id, resume_id FROM document_submissions WHERE student_id = ?",
        [req.user.id]
      );

      // Remove any previous files the student is replacing.
      if (existing.length) {
        for (const column of ["certificate_id", "resume_id"]) {
          const storedId = existing[0][column];
          if (storedId) {
            const previousPath = path.join(UPLOAD_DIR, storedId);
            if (previousPath.startsWith(UPLOAD_DIR) && fs.existsSync(previousPath)) {
              try {
                fs.rmSync(previousPath, { force: true });
              } catch (error) {
                console.error("Old file cleanup error:", error.message);
              }
            }
          }
        }
      }

      const columnValues = {
        certificate_id: path.basename(certificate.filename),
        certificate_original_name: certificate.originalname.slice(0, 255),
        resume_id: path.basename(resume.filename),
        resume_original_name: resume.originalname.slice(0, 255),
      };

      await pool.execute(
        `INSERT INTO document_submissions
          (student_id, education, certificate_id, certificate_original_name,
           resume_id, resume_original_name, status, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
         ON DUPLICATE KEY UPDATE
           education = VALUES(education),
           certificate_id = VALUES(certificate_id),
           certificate_original_name = VALUES(certificate_original_name),
           resume_id = VALUES(resume_id),
           resume_original_name = VALUES(resume_original_name),
           status = 'pending',
           reviewer_note = NULL,
           submitted_at = NOW()`,
        [
          req.user.id,
          education,
          columnValues.certificate_id,
          columnValues.certificate_original_name,
          columnValues.resume_id,
          columnValues.resume_original_name,
        ]
      );

      await pool.execute(
        `INSERT INTO placement_enrollments (student_id, status, submitted_at)
         VALUES (?, 'pending', NOW())
         ON DUPLICATE KEY UPDATE
           status = 'pending',
           reviewer_note = NULL,
           submitted_at = NOW()`,
        [req.user.id]
      );

      notify(
        req.user.id,
        "documents",
        "Documents submitted for review",
        "Your enrollment documents were submitted and are pending review.",
        "/enrollment-verification"
      );

      res.status(201).json({
        success: true,
        message: "Your documents have been submitted for verification",
      });
    } catch (error) {
      cleanup(uploaded);
      next(error);
    }
  }
);

// Student views their own submission metadata (never file contents here)
router.get("/my", authenticate, requireRole("student"), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT education, status, reviewer_note, submitted_at, reviewed_at,
              certificate_original_name, resume_original_name
       FROM document_submissions WHERE student_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      submission: rows[0] || null,
    });
  } catch (error) {
    console.error("Get document status:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch document status",
    });
  }
});

// Admin lists all submissions (metadata with owner details)
router.get("/admin/all", authenticate, requireRole("admin"), async (req, res) => {
  try {
    let [submissions] = await pool.execute(
      `SELECT d.id, d.education, d.status, d.reviewer_note,
              d.submitted_at, d.reviewed_at,
              d.certificate_id, d.certificate_original_name,
              d.resume_id, d.resume_original_name,
              u.id AS student_id, u.full_name, u.email, u.phone
       FROM document_submissions d
       JOIN users u ON u.id = d.student_id
       ORDER BY d.id ASC`
    );

    submissions = submissions.map((item) => {
      const certificate_available = fileExistsOnDisk(item.certificate_id);
      const resume_available = fileExistsOnDisk(item.resume_id);
      delete item.certificate_id;
      delete item.resume_id;
      return { ...item, certificate_available, resume_available };
    });

    res.json({ success: true, submissions });
  } catch (error) {
    console.error("Admin documents list:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch submissions",
    });
  }
});

function fileExistsOnDisk(storedName) {
  if (!storedName) return false;
  const safeName = path.basename(String(storedName));
  if (!safeName) return false;
  const filePath = path.join(UPLOAD_DIR, safeName);
  if (!filePath.startsWith(UPLOAD_DIR)) return false;
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Admin approves / rejects / requests resubmission with a note
router.patch(
  "/admin/:studentId/status",
  authenticate,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const note =
        typeof req.body.note === "string"
          ? req.body.note.trim().slice(0, 500)
          : "";

      if (!["approved", "needs_resubmission", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be approved, needs_resubmission, or rejected",
        });
      }

      if (!["approved"].includes(status) && !note) {
        return res.status(400).json({
          success: false,
          message: "A review note is required for resubmission or rejection",
        });
      }

      const [result] = await pool.execute(
        `UPDATE document_submissions
         SET status = ?, reviewer_note = ?, reviewed_at = NOW()
         WHERE student_id = ?`,
        [status, note || "Documents approved by administrator.", req.params.studentId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Submission not found",
        });
      }

      await pool.execute(
        `UPDATE placement_enrollments
         SET status = ?, reviewer_note = ?, reviewed_at = NOW()
         WHERE student_id = ?`,
        [status, note || null, req.params.studentId]
      );

      notify(
        Number(req.params.studentId),
        "documents",
        `Document review: ${status.replace(/_/g, " ")}`,
        note || "Your enrollment documents were approved.",
        "/enrollment-verification"
      );

      res.json({
        success: true,
        message: `Documents marked ${status.replace(/_/g, " ")}`,
      });
    } catch (error) {
      console.error("Admin document status:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to update document status",
      });
    }
  }
);

// Authorization-gated file download for owner (student) and admins only.
// GET /api/documents/:field/:studentId
router.get(
  "/:field/:studentId",
  authenticate,
  async (req, res, next) => {
    const { field, studentId } = req.params;
    const columnMap = {
      certificate: "certificate_id",
      resume: "resume_id",
    };

    try {
      if (!columnMap[field]) {
        return res.status(400).json({ success: false, message: "Unknown document type" });
      }

      const viewerId = Number(studentId);
      if (!Number.isSafeInteger(viewerId) || viewerId < 1) {
        return res.status(400).json({ success: false, message: "Invalid student id" });
      }

      if (req.user.role === "admin" || req.user.id === viewerId) {
        // owner (student) and admins can access both document types
      } else if (
        req.user.role === "company" &&
        field === "resume"
      ) {
        // Companies may view the resume of a student who applied to
        // one of their own internships, and nothing else.
        const [applicants] = await pool.execute(
          `SELECT 1 FROM applications a
           JOIN internships i ON i.id = a.internship_id
           JOIN companies c ON c.id = i.company_id
           WHERE a.student_id = ? AND c.user_id = ? LIMIT 1`,
          [viewerId, req.user.id]
        );
        if (!applicants.length) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this document",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this document",
        });
      }

      const [rows] = await pool.execute(
        `SELECT ${columnMap[field]}, ${field === "certificate" ? "certificate_original_name" : "resume_original_name"} AS original_name
         FROM document_submissions WHERE student_id = ?`,
        [viewerId]
      );

      if (!rows.length || !rows[0][columnMap[field]]) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const storedName = rowSafe(rows[0][columnMap[field]]);
      const filePath = path.join(UPLOAD_DIR, storedName);
      if (!filePath.startsWith(UPLOAD_DIR) || !fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "File missing" });
      }

      res.download(filePath, rows[0].original_name || storedName);
    } catch (error) {
      next(error);
    }
  }
);

function rowSafe(value) {
  return path.basename(String(value || ""));
}

module.exports = router;
