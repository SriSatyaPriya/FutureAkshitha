import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Users,
  Building2,
  CheckCircle,
  XCircle,
  Search,
  ShieldCheck,
  ClipboardList,
  BookOpen,
  GraduationCap,
  AlertCircle,
  X,
  Layers,
  FileCheck2,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { API_BASE_URL, apiRequest, getStoredToken } from "../services/api";

function adminSupportedKind(originalName) {
  const extension = String(originalName || "")
    .split(".")
    .pop()
    ?.toLowerCase();

  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png"].includes(extension)) return "image";
  return null;
}

function adminDocName(originalName, maxLength = 30) {
  const name = String(originalName || "").trim();
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
}

async function adminFetchDocument(studentId, field) {
  if (!getStoredToken()) {
    throw new Error("You need to sign in first.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/documents/${field}/${studentId}`,
    { headers: { Authorization: `Bearer ${getStoredToken()}` } }
  );

  if (!response.ok) {
    let message = "This document is missing or unavailable.";
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default message.
    }
    throw new Error(message);
  }

  return response.blob();
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    totalInternships: 0,
    totalApplications: 0,
  });

  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [partnershipForm, setPartnershipForm] = useState({
    company_id: "",
    college_name: "",
    note: "",
  });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [docViewer, setDocViewer] = useState(null);
  const [docError, setDocError] = useState("");

  async function openStudentDocument(studentId, field, originalName) {
    setDocError("");
    if (!adminSupportedKind(originalName)) {
      setDocError(`"${originalName}" is not previewable. Please download it instead.`);
      return;
    }
    try {
      const blob = await adminFetchDocument(studentId, field);
      setDocViewer({
        url: URL.createObjectURL(blob),
        kind: adminSupportedKind(originalName),
        name: originalName,
        studentId,
        field,
      });
    } catch (err) {
      setDocError(err.message || "Unable to open the document right now.");
    }
  }

  async function downloadStudentDocument(studentId, field, originalName) {
    setDocError("");
    try {
      const blob = await adminFetchDocument(studentId, field);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName || `document-${field}-${studentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setDocError(err.message || "Unable to download the document right now.");
    }
  }

  function closeDocViewer() {
    if (docViewer?.url) {
      URL.revokeObjectURL(docViewer.url);
    }
    setDocViewer(null);
  }

  const [courseModal, setCourseModal] = useState(null);
  const [courseSaving, setCourseSaving] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    domain: "",
    duration: "",
    fee: "",
    credits: "",
    item_type: "course",
    source_annexure: "",
    source_category: "",
    source_order: "",
    language: "",
    vertical: "",
    skills: "",
    delivery_mode: "",
    duration_hours: "",
    duration_weeks: "",
    status: "draft",
  });

  function openAddCourse() {
    setCourseForm({
      title: "",
      description: "",
      domain: "",
      duration: "",
      fee: "",
      credits: "",
      item_type: "course",
      source_annexure: "",
      source_category: "",
      source_order: "",
      language: "",
      vertical: "",
      skills: "",
      delivery_mode: "",
      duration_hours: "",
      duration_weeks: "",
      status: "draft",
    });
    setCourseModal({ mode: "add" });
  }

  function openEditCourse(course) {
    setCourseForm({
      title: course.title || "",
      description: course.description || "",
      domain: course.domain || "",
      duration: course.duration || "",
      fee: String(course.fee ?? 0),
      credits: String(course.credits ?? 0),
      item_type: course.item_type || "course",
      source_annexure: course.source_annexure || "",
      source_category: course.source_category || "",
      source_order: course.source_order ?? "",
      language: course.language || "",
      vertical: course.vertical || "",
      skills: course.skills || "",
      delivery_mode: course.delivery_mode || "",
      duration_hours: course.duration_hours ?? "",
      duration_weeks: course.duration_weeks ?? "",
      status: course.status || "draft",
    });
    setCourseModal({ mode: "edit", course });
  }

  async function loadAdminData() {
    try {
      setIsLoading(true);
      setError("");

      const [statsRes, studentsRes, enrollmentsRes, applicationsRes, companiesRes, coursesRes, certsRes, partnershipsRes] =
        await Promise.all([
          apiRequest("/api/admin/stats").catch(() => null),
          apiRequest("/api/admin/students").catch(() => null),
          apiRequest("/api/admin/enrollments").catch(() => null),
          apiRequest("/api/admin/applications").catch(() => null),
          apiRequest("/api/admin/companies").catch(() => null),
          apiRequest("/api/admin/courses").catch(() => null),
          apiRequest("/api/certificates").catch(() => null),
          apiRequest("/api/admin/partnerships").catch(() => null),
        ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (studentsRes?.students) setStudents(studentsRes.students);
      if (enrollmentsRes?.enrollments) setEnrollments(enrollmentsRes.enrollments);
      if (applicationsRes?.applications) setApplications(applicationsRes.applications);
      if (companiesRes?.companies) setCompanies(companiesRes.companies);
      if (coursesRes?.courses) setCourses(coursesRes.courses);
      if (certsRes?.certificates) setCertificates(certsRes.certificates);
      if (partnershipsRes?.partnerships) setPartnerships(partnershipsRes.partnerships);
    } catch (err) {
      setError(err.message || "Unable to load admin data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleUpdateEnrollment(enrollmentId, status) {
    setMessage("");
    setError("");
    try {
      const res = await apiRequest(`/api/admin/enrollments/${enrollmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(res.message || `Enrollment status updated to ${status}.`);
      setConfirmModal(null);
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to update enrollment.");
    }
  }

  async function handleUpdateCompany(companyId, status, reason = "") {
    setMessage("");
    setError("");
    try {
      const res = await apiRequest(`/api/admin/companies/${companyId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ status, note: reason }),
      });
      setMessage(res.message || `Company verification updated to ${status}.`);
      setConfirmModal(null);
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to update company verification.");
    }
  }

  async function handleStudentStatus(studentId, status, studentName) {
    setMessage("");
    setError("");
    if (status === "suspended") {
      setConfirmModal({
        type: "suspend",
        title: `Suspend student: ${studentName}?`,
        message: "The student will not be able to sign in or use the platform until reactivated.",
        onConfirm: async () => {
          try {
            const res = await apiRequest(`/api/admin/students/${studentId}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status }),
            });
            setMessage(res.message);
            await loadAdminData();
          } catch (err) {
            setError(err.message || "Unable to update student account.");
          }
          setConfirmModal(null);
        },
      });
      return;
    }
    try {
      const res = await apiRequest(`/api/admin/students/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(res.message || "Student account updated.");
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to update student account.");
    }
  }

  async function handleCompanyAccountStatus(company, status) {
    setMessage("");
    setError("");
    if (status === "suspended") {
      setConfirmModal({
        type: "suspend",
        title: `Suspend company: ${company.company_name}?`,
        message: "The company account will be blocked from signing in until reactivated.",
        onConfirm: async () => {
          try {
            const res = await apiRequest(`/api/admin/companies/${company.id}/status`, {
              method: "PATCH",
              body: JSON.stringify({ status }),
            });
            setMessage(res.message);
            await loadAdminData();
          } catch (err) {
            setError(err.message || "Unable to update company account.");
          }
          setConfirmModal(null);
        },
      });
      return;
    }
    try {
      const res = await apiRequest(`/api/admin/companies/${company.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(res.message || "Company account updated.");
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to update company account.");
    }
  }

  async function handleIssueCertificate(payload) {
    setMessage("");
    setError("");
    try {
      const res = await apiRequest("/api/certificates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage(res.message || "Certificate issued.");
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to issue certificate.");
    }
  }

  async function handleRevokeCertificate(certificateId) {
    setMessage("");
    setError("");
    setConfirmModal({
      type: "revoke",
      title: "Revoke this certificate?",
      message: "The student will no longer see this certificate on their dashboard.",
      onConfirm: async () => {
        try {
          const res = await apiRequest(`/api/certificates/${certificateId}`, {
            method: "DELETE",
          });
          setMessage(res.message || "Certificate revoked.");
          await loadAdminData();
        } catch (err) {
          setError(err.message || "Unable to revoke certificate.");
        }
        setConfirmModal(null);
      },
    });
  }

  async function handleCreatePartnership(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const companyId = Number(partnershipForm.company_id);
    if (!Number.isSafeInteger(companyId) || companyId < 1 || !partnershipForm.college_name.trim()) {
      setError("Select a company and enter the college name.");
      return;
    }

    try {
      const res = await apiRequest("/api/admin/partnerships", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId,
          college_name: partnershipForm.college_name.trim(),
          note: partnershipForm.note,
        }),
      });
      setMessage(res.message || "Partnership recorded.");
      setPartnershipForm({ company_id: "", college_name: "", note: "" });
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to record partnership.");
    }
  }

  async function handleUpdatePartnership(partnershipId, status) {
    setMessage("");
    setError("");
    try {
      const res = await apiRequest(`/api/admin/partnerships/${partnershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setMessage(res.message || "Partnership updated.");
      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to update partnership.");
    }
  }

  async function handleSaveCourse(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    const fee = Number(courseForm.fee);
    const credits = Number(courseForm.credits);
    const durationHours = Number(courseForm.duration_hours);
    const durationWeeks = Number(courseForm.duration_weeks);
    const sourceOrder = Number(courseForm.source_order);

    if (!courseForm.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (courseForm.fee.trim() !== "" && (!Number.isFinite(fee) || fee < 0)) {
      setError("Fee must be a non-negative number.");
      return;
    }

    if (courseForm.credits.trim() !== "" && (!Number.isFinite(credits) || credits < 0)) {
      setError("Credits must be a non-negative number.");
      return;
    }

    if (
      (courseForm.duration_hours.trim() !== "" && (!Number.isFinite(durationHours) || durationHours < 0)) ||
      (courseForm.duration_weeks.trim() !== "" && (!Number.isFinite(durationWeeks) || durationWeeks < 0)) ||
      (courseForm.source_order.trim() !== "" && (!Number.isFinite(sourceOrder) || sourceOrder < 0))
    ) {
      setError("Duration hours, duration weeks, and source order must be non-negative numbers.");
      return;
    }

    setCourseSaving(true);

    try {
      const isEditing = courseModal?.mode === "edit";

      const payload = {
        title: courseForm.title.trim(),
        description: courseForm.description.trim() || null,
        domain: courseForm.domain.trim() || null,
        duration: courseForm.duration.trim() || null,
        fee: courseForm.fee.trim() !== "" ? fee : null,
        credits: courseForm.credits.trim() !== "" ? credits : null,
        item_type: courseForm.item_type || "course",
        source_annexure: courseForm.source_annexure.trim() || null,
        source_category: courseForm.source_category.trim() || null,
        source_order: courseForm.source_order.trim() !== "" ? sourceOrder : null,
        language: courseForm.language.trim() || null,
        vertical: courseForm.vertical.trim() || null,
        skills: courseForm.skills.trim() || null,
        delivery_mode: courseForm.delivery_mode.trim() || null,
        duration_hours: courseForm.duration_hours.trim() !== "" ? durationHours : null,
        duration_weeks: courseForm.duration_weeks.trim() !== "" ? durationWeeks : null,
        status: courseForm.status || "draft",
      };

      const res = await apiRequest(
        isEditing
          ? `/api/admin/courses/${courseModal.course.id}`
          : "/api/admin/courses",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setCourseModal(null);
      setMessage(
        res.message ||
          (isEditing
            ? "Course updated successfully."
            : "Course created successfully.")
      );

      await loadAdminData();
    } catch (err) {
      setError(err.message || "Unable to save course.");
    } finally {
      setCourseSaving(false);
    }
  }

  // Filtered queries based on active tab
  const STUDENTS_PER_PAGE = 20;

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        const matchesSearch =
          !q ||
          (s.full_name || "").toLowerCase().includes(q) ||
          (s.email || "").toLowerCase().includes(q) ||
          (s.phone || "").includes(q);
        return matchesSearch;
      })
      .sort((a, b) => Number(a.id) - Number(b.id));
  }, [students, search]);

  const totalStudentPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE)
  );
  const currentStudentPage = Math.min(studentPage, totalStudentPages);
  const pagedStudents = useMemo(
    () =>
      filteredStudents.slice(
        (currentStudentPage - 1) * STUDENTS_PER_PAGE,
        currentStudentPage * STUDENTS_PER_PAGE
      ),
    [filteredStudents, currentStudentPage]
  );

  const filteredEnrollments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const matchesSearch =
        !q ||
        (e.student_name || "").toLowerCase().includes(q) ||
        (e.student_email || "").toLowerCase().includes(q) ||
        (e.course_title || "").toLowerCase().includes(q);
      const matchesStatus =
        filter === "All" ||
        (e.status || "").toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, search, filter]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      const matchesSearch =
        !q ||
        (a.student_name || "").toLowerCase().includes(q) ||
        (a.student_email || "").toLowerCase().includes(q) ||
        (a.internship_title || "").toLowerCase().includes(q) ||
        (a.company_name || "").toLowerCase().includes(q);
      const matchesStatus =
        filter === "All" ||
        (a.status || "").toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, filter]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesSearch =
        !q ||
        (c.company_name || "").toLowerCase().includes(q) ||
        (c.contact_email || "").toLowerCase().includes(q) ||
        (c.contact_person || "").toLowerCase().includes(q);
      const matchesStatus =
        filter === "All" ||
        (c.verification_status || "").toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [companies, search, filter]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      return (
        !q ||
        (c.title || "").toLowerCase().includes(q) ||
        (c.domain || "").toLowerCase().includes(q)
      );
    });
  }, [courses, search]);

  function formatDate(value) {
    if (!value) return "Date unavailable";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "Date unavailable" : d.toLocaleDateString();
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <ShieldCheck size={30} />
          <div>
            <h1>Future Akshitha</h1>
            <p>Administration Portal</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="admin-role">Admin</span>
        </div>
      </header>

      <section className="admin-welcome">
        <p className="admin-eyebrow">ADMINISTRATION</p>
        <h2>Admin Management Portal</h2>
        <p>Live governance of registered students, course enrollments, internship applications, and partner companies.</p>
      </section>

      {/* Notices */}
      {message && (
        <div style={{ margin: "0 6% 20px" }} className="internship-notice" role="status">
          <CheckCircle size={16} /> {message}
        </div>
      )}
      {error && (
        <div style={{ margin: "0 6% 20px" }} className="internship-notice error" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="admin-tabs" aria-label="Admin Sections">
        <button
          type="button"
          className={`admin-tab ${tab === "overview" ? "active" : ""}`}
          onClick={() => {
            setTab("overview");
            setSearch("");
            setFilter("All");
          }}
        >
          <Layers size={15} /> Overview
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "students" ? "active" : ""}`}
          onClick={() => {
            setTab("students");
            setSearch("");
            setFilter("All");
          }}
        >
          <Users size={15} /> Registered Students
          <span className="admin-tab-count">{stats.totalStudents}</span>
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "enrollments" ? "active" : ""}`}
          onClick={() => {
            setTab("enrollments");
            setSearch("");
            setFilter("All");
          }}
        >
          <GraduationCap size={15} /> Course Enrollments
          {stats.pendingEnrollments > 0 ? (
            <span
              className="admin-tab-count"
              style={{ background: "#fef3c7", color: "#92400e", fontWeight: 800 }}
            >
              {stats.pendingEnrollments} Pending
            </span>
          ) : (
            <span className="admin-tab-count">{stats.totalEnrollments}</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "applications" ? "active" : ""}`}
          onClick={() => {
            setTab("applications");
            setSearch("");
            setFilter("All");
          }}
        >
          <ClipboardList size={15} /> Internship Applications
          <span className="admin-tab-count">{stats.totalApplications}</span>
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "companies" ? "active" : ""}`}
          onClick={() => {
            setTab("companies");
            setSearch("");
            setFilter("All");
          }}
        >
          <Building2 size={15} /> Partner Companies
          {stats.pendingCompanies > 0 ? (
            <span
              className="admin-tab-count"
              style={{ background: "#fef3c7", color: "#92400e", fontWeight: 800 }}
            >
              {stats.pendingCompanies} Pending
            </span>
          ) : (
            <span className="admin-tab-count">{stats.totalCompanies}</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "courses" ? "active" : ""}`}
          onClick={() => {
            setTab("courses");
            setSearch("");
            setFilter("All");
          }}
        >
          <BookOpen size={15} /> Courses Catalog
          <span className="admin-tab-count">{stats.totalCourses}</span>
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "certificates" ? "active" : ""}`}
          onClick={() => {
            setTab("certificates");
            setSearch("");
            setFilter("All");
          }}
        >
          <GraduationCap size={15} /> Certificates
          <span className="admin-tab-count">{certificates.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab ${tab === "partnerships" ? "active" : ""}`}
          onClick={() => {
            setTab("partnerships");
            setSearch("");
            setFilter("All");
          }}
        >
          <Users size={15} /> Partnerships
          <span className="admin-tab-count">{partnerships.length}</span>
        </button>
      </nav>

      {/* TAB 1: OVERVIEW & STATS */}
      {tab === "overview" && (
        <>
          <section className="admin-stats">
            <div className="admin-stat-card">
              <Users size={25} />
              <p>Total Registered Students</p>
              <h3>{stats.totalStudents}</h3>
              <small>Profiles created in MySQL</small>
            </div>

            <div className="admin-stat-card">
              <GraduationCap size={25} />
              <p>Course Enrollments</p>
              <h3>{stats.totalEnrollments}</h3>
              <small>{stats.pendingEnrollments} pending review</small>
            </div>

            <div className="admin-stat-card">
              <Building2 size={25} />
              <p>Registered Companies</p>
              <h3>{stats.totalCompanies}</h3>
              <small>{stats.pendingCompanies} awaiting verification</small>
            </div>

            <div className="admin-stat-card">
              <ClipboardList size={25} />
              <p>Internship Applications</p>
              <h3>{stats.totalApplications}</h3>
              <small>Across {stats.totalInternships} open postings</small>
            </div>
          </section>

          {/* Quick Action Cards */}
          <section className="admin-quick-links" style={{ padding: "0 6% 30px" }}>
            <h2>Governance & Review Queues</h2>
            <div className="admin-quick-links-grid">
              <article
                className="admin-quick-link"
                style={{ cursor: "pointer" }}
                onClick={() => setTab("enrollments")}
              >
                <h3>Review Course Enrollments</h3>
                <p>
                  {stats.pendingEnrollments > 0
                    ? `${stats.pendingEnrollments} student enrollment(s) awaiting approval.`
                    : "All current course enrollments have been reviewed."}
                </p>
                <span style={{ color: "#a67a25", fontWeight: 700, fontSize: "13px" }}>
                  Manage Enrollments →
                </span>
              </article>

              <article
                className="admin-quick-link"
                style={{ cursor: "pointer" }}
                onClick={() => setTab("companies")}
              >
                <h3>Company Verifications</h3>
                <p>
                  {stats.pendingCompanies > 0
                    ? `${stats.pendingCompanies} company account(s) waiting for verification.`
                    : "All partner companies are currently verified."}
                </p>
                <span style={{ color: "#a67a25", fontWeight: 700, fontSize: "13px" }}>
                  Review Companies →
                </span>
              </article>

              <article
                className="admin-quick-link"
                style={{ cursor: "pointer" }}
                onClick={() => setTab("students")}
              >
                <h3>Inspect Student Profiles</h3>
                <p>View registered students, email records, and enrolled courses.</p>
                <span style={{ color: "#a67a25", fontWeight: 700, fontSize: "13px" }}>
                  Browse Students →
                </span>
              </article>

              <article className="admin-quick-link">
                <h3>Placement Document Verification</h3>
                <p>Review student completion certificates and uploaded resumes.</p>
                <Link to="/enrollment-review">Go to Document Review →</Link>
              </article>
            </div>
          </section>
        </>
      )}

      {/* TAB 2: REGISTERED STUDENTS */}
      {tab === "students" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Registered Students</h2>
              <p>Active student accounts stored in MySQL database.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by student name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search students"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="admin-empty">No students match your query.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Registered Date</th>
                    <th>Courses Enrolled</th>
                    <th>Internship Apps</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStudents.map((s) => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>
                        <strong>{s.full_name || "Student"}</strong>
                      </td>
                      <td>{s.email}</td>
                      <td>{s.phone || "—"}</td>
                      <td>{formatDate(s.created_at)}</td>
                      <td>
                        <span className="admin-tab-count" style={{ fontSize: "12px" }}>
                          {s.enrollment_count} course(s)
                        </span>
                      </td>

                      <td>
                        <span className="admin-tab-count" style={{ fontSize: "12px" }}>
                          {s.application_count} app(s)
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="admin-tab"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => setSelectedDetail({ type: "student", data: s })}
                          >
                            View Details
                          </button>
                          {s.account_status === "suspended" ? (
                            <button
                              type="button"
                              className="admin-approve"
                              onClick={() => handleStudentStatus(s.id, "active", s.full_name)}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-reject"
                              onClick={() => handleStudentStatus(s.id, "suspended", s.full_name)}
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredStudents.length > STUDENTS_PER_PAGE && (
            <nav className="admin-pagination" aria-label="Student pages">
              <button
                type="button"
                disabled={currentStudentPage === 1}
                onClick={() => setStudentPage(currentStudentPage - 1)}
              >
                ← Prev
              </button>

              {Array.from({ length: totalStudentPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={page === currentStudentPage ? "active" : ""}
                    onClick={() => setStudentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentStudentPage === totalStudentPages}
                onClick={() => setStudentPage(currentStudentPage + 1)}
              >
                Next →
              </button>

              <span>
                Page {currentStudentPage} of {totalStudentPages} ·{" "}
                {filteredStudents.length} students
              </span>
            </nav>
          )}
        </section>
      )}

      {/* TAB 3: COURSE ENROLLMENTS */}
      {tab === "enrollments" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Course Enrollment Management</h2>
              <p>Review student course enrollment requests and assign approved/rejected decisions.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by student name, email, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search enrollments"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter enrollments by status"
            >
              <option value="All">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {filteredEnrollments.length === 0 ? (
            <p className="admin-empty">No course enrollments found matching the criteria.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Enrollment ID</th>
                    <th>Student Name & Email</th>
                    <th>Course Title</th>
                    <th>Domain</th>
                    <th>Enrolled Date</th>
                    <th>Status</th>
                    <th>Decision Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <strong>{item.student_name}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          {item.student_email}
                        </div>
                      </td>
                      <td>
                        <strong>{item.course_title}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          {item.duration || "Self-paced"} · {item.credits} Credits
                        </div>
                      </td>
                      <td>{item.course_domain || "IT"}</td>
                      <td>{formatDate(item.enrolled_at)}</td>
                      <td>
                        <span className={`badge badge-${item.status || "pending"}`}>
                          {item.status || "pending"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {item.status !== "approved" && (
                            <button
                              type="button"
                              className="admin-approve"
                              onClick={() => handleUpdateEnrollment(item.id, "approved")}
                              title="Approve this student enrollment"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}
                          {item.status !== "rejected" && (
                            <button
                              type="button"
                              className="admin-reject"
                              onClick={() =>
                                setConfirmModal({
                                  type: "enrollment",
                                  id: item.id,
                                  title: `Reject Enrollment #${item.id}?`,
                                  message: `Are you sure you want to reject the enrollment of ${item.student_name} in ${item.course_title}?`,
                                  onConfirm: () => handleUpdateEnrollment(item.id, "rejected"),
                                })
                              }
                              title="Reject this student enrollment"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          )}
                          {item.status === "completed" && (
                            <button
                              type="button"
                              className="admin-tab"
                              style={{ padding: "6px 12px", fontSize: "12px" }}
                              onClick={() => {
                                const certModal = {
                                  type: "issueCertificate",
                                  payload: {
                                    student_id: item.student_id,
                                    source: "course",
                                    source_id: item.course_id,
                                  },
                                  title: `Issue course certificate?`,
                                  message: `Issue a completion certificate to ${item.student_name} for ${item.course_title}?`,
                                  onConfirm: async () => {
                                    await handleIssueCertificate(certModal.payload);
                                    setConfirmModal(null);
                                  },
                                };
                                setConfirmModal(certModal);
                              }}
                            >
                              Issue Certificate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: INTERNSHIP APPLICATIONS */}
      {tab === "applications" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Internship Applications Monitoring</h2>
              <p>Read-only overview of student applications across all partner companies.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search student, internship, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search applications"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter applications by status"
            >
              <option value="All">All statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="selected">Selected</option>
              <option value="joined">Joined</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredApplications.length === 0 ? (
            <p className="admin-empty">No internship applications match your query.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Student Details</th>
                    <th>Internship Role</th>
                    <th>Company Name</th>
                    <th>Applied Date</th>
                    <th>Stage Status</th>
                    <th>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td>#{app.id}</td>
                      <td>
                        <strong>{app.student_name}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          {app.student_email}
                        </div>
                      </td>
                      <td>
                        <strong>{app.internship_title}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          {app.location || "Remote"}
                        </div>
                      </td>
                      <td>{app.company_name}</td>
                      <td>{formatDate(app.applied_at)}</td>
                      <td>
                        <span className={`badge badge-${app.status || "applied"}`}>
                          {app.status || "applied"}
                        </span>
                      </td>
                      <td>
                        {app.status === "completed" ? (
                          <button
                            type="button"
                            className="admin-tab"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => {
                              const certModal = {
                                type: "issueCertificate",
                                payload: {
                                  student_id: app.student_id,
                                  source: "internship",
                                  source_id: app.internship_id,
                                },
                                title: "Issue internship completion certificate?",
                                message: `Issue a completion certificate to ${app.student_name} for ${app.internship_title} (${app.company_name})?`,
                                onConfirm: async () => {
                                  await handleIssueCertificate(certModal.payload);
                                  setConfirmModal(null);
                                },
                              };
                              setConfirmModal(certModal);
                            }}
                          >
                            Issue Certificate
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: PARTNER COMPANIES */}
      {tab === "companies" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Partner Company Verification</h2>
              <p>Verify or reject company registrations before allowing live internship postings.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search company or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search companies"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter companies by status"
            >
              <option value="All">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredCompanies.length === 0 ? (
            <p className="admin-empty">No partner companies match your query.</p>
          ) : (
            <div className="admin-company-list">
              {filteredCompanies.map((company) => (
                <article className="admin-company-row" key={company.id}>
                  <div className="admin-company-info">
                    <div className="admin-company-icon">
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3>{company.company_name}</h3>
                      <p>
                        <strong>Contact:</strong> {company.contact_person || "—"} ({company.contact_email || "No email"})
                      </p>
                      {company.website && (
                        <p>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#a67a25", textDecoration: "underline" }}
                          >
                            {company.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`admin-status ${(company.verification_status || "pending").toLowerCase()}`}
                  >
                    {company.verification_status || "pending"}
                  </span>

                  <div className="admin-actions">
                    {company.verification_status !== "approved" && (
                      <button
                        type="button"
                        className="admin-approve"
                        onClick={() => handleUpdateCompany(company.id, "approved")}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                    )}

                    {company.verification_status !== "rejected" && (
                      <button
                        type="button"
                        className="admin-reject"
                        onClick={() => {
                          setRejectReason("");
                          setRejectReasonError("");
                          setConfirmModal({
                            type: "company",
                            id: company.id,
                            title: `Reject Company: ${company.company_name}?`,
                            message: `Are you sure you want to reject verification for ${company.company_name}? They will not be able to post internships.`,
                            onConfirm: (reason) =>
                              handleUpdateCompany(company.id, "rejected", reason),
                          });
                        }}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    )}

                    {company.account_status === "suspended" ? (
                      <button
                        type="button"
                        className="admin-approve"
                        onClick={() => handleCompanyAccountStatus(company, "active")}
                      >
                        Reactivate
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-reject"
                        onClick={() => handleCompanyAccountStatus(company, "suspended")}
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 6: COURSES CATALOG */}
      {tab === "courses" && (
        <section className="admin-panel">
          <div
            className="admin-panel-heading"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2>Course Catalog Master Data</h2>
              <p>Manage learning programs, fees, duration, and course status.</p>
            </div>

            <button
              type="button"
              className="admin-course-add"
              onClick={openAddCourse}
            >
              <Plus size={16} />
              Add Course
            </button>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search courses"
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Course Title</th>
                  <th>Type</th>
                  <th>Section</th>
                  <th>Language</th>
                  <th>Vertical</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <strong>{c.title}</strong>
                      <div style={{ color: "#64748b", fontSize: "12px" }}>
                        {c.description ? c.description.slice(0, 75) + "..." : ""}
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: 700, color: "#65718a" }}>
                        {c.item_type || "course"}
                      </span>
                    </td>
                    <td>{c.source_category || "—"}</td>
                    <td>{c.language || "—"}</td>
                    <td>{c.vertical || "—"}</td>
                    <td>{c.credits ?? "—"}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            c.status === "published"
                              ? "#dcfce7"
                              : c.status === "draft"
                                ? "#fef3c7"
                                : "#fee2e2",
                          color:
                            c.status === "published"
                              ? "#166534"
                              : c.status === "draft"
                                ? "#92400e"
                                : "#991b1b",
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-course-edit"
                        onClick={() => openEditCourse(c)}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 7: CERTIFICATES */}
      {tab === "certificates" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Completion Certificates</h2>
              <p>Certificates can only be issued after a course or internship is completed. Use the Enrollments and Applications tabs to issue new certificates.</p>
            </div>
          </div>

          {certificates.length === 0 ? (
            <p className="admin-empty">No certificates issued yet.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Certificate No</th>
                    <th>Student</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Issued On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.certificate_no}</strong></td>
                      <td>
                        <strong>{c.full_name}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>{c.email}</div>
                      </td>
                      <td>{c.title}</td>
                      <td>{c.source === "course" ? "Course" : "Internship"}</td>
                      <td>{formatDate(c.issued_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-reject"
                          onClick={() => handleRevokeCertificate(c.id)}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 8: PARTNERSHIPS */}
      {tab === "partnerships" && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Company-College Partnerships</h2>
              <p>Record and manage collaborations between partner companies and colleges.</p>
            </div>
          </div>

          <form
            onSubmit={handleCreatePartnership}
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "flex-end",
              marginBottom: "20px",
            }}
          >
            <label>
              Company
              <select
                value={partnershipForm.company_id}
                onChange={(e) => setPartnershipForm({ ...partnershipForm, company_id: e.target.value })}
                required
                style={{ display: "block", minWidth: "180px" }}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
            </label>

            <label>
              College name
              <input
                type="text"
                value={partnershipForm.college_name}
                onChange={(e) => setPartnershipForm({ ...partnershipForm, college_name: e.target.value })}
                placeholder="e.g. Osmania University"
                required
                style={{ display: "block", minWidth: "220px" }}
              />
            </label>

            <label>
              Note
              <input
                type="text"
                value={partnershipForm.note}
                onChange={(e) => setPartnershipForm({ ...partnershipForm, note: e.target.value })}
                placeholder="Optional note"
                style={{ display: "block", minWidth: "220px" }}
              />
            </label>

            <button type="submit" className="admin-course-add">
              Record Partnership
            </button>
          </form>

          {partnerships.length === 0 ? (
            <p className="admin-empty">No partnerships recorded yet.</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Company</th>
                    <th>College</th>
                    <th>Note</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partnerships.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{p.company_name}</td>
                      <td><strong>{p.college_name}</strong></td>
                      <td>{p.note || "—"}</td>
                      <td><span className="badge badge-approved">{p.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {p.status !== "active" && (
                            <button
                              type="button"
                              className="admin-approve"
                              onClick={() => handleUpdatePartnership(p.id, "active")}
                            >
                              Activate
                            </button>
                          )}
                          {p.status !== "ended" && (
                            <button
                              type="button"
                              className="admin-reject"
                              onClick={() => handleUpdatePartnership(p.id, "ended")}
                            >
                              End
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Add / Edit Course Modal */}
      {courseModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal admin-course-modal" onSubmit={handleSaveCourse}>
            <h3>{courseModal.mode === "edit" ? "Edit Course" : "Add New Course"}</h3>
            <p>Enter the course details below.</p>

            <div className="admin-course-form">
              <label>
                Course Title *
                <input
                  required
                  maxLength={200}
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, title: e.target.value })
                  }
                  placeholder="e.g. Digital Marketing Advance Certificate Course"
                />
              </label>

              <label>
                Item Type
                <select
                  value={courseForm.item_type}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, item_type: e.target.value })
                  }
                >
                  <option value="course">Course</option>
                  <option value="internship">Internship</option>
                  <option value="project">Project</option>
                </select>
              </label>

              <label>
                Source Annexure
                <select
                  value={courseForm.source_annexure}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, source_annexure: e.target.value })
                  }
                >
                  <option value="">None</option>
                  <option value="Annexure A">Annexure A</option>
                  <option value="Annexure B">Annexure B</option>
                  <option value="Annexure C">Annexure C</option>
                  <option value="Annexure D">Annexure D</option>
                </select>
              </label>

              <label>
                Source Category
                <input
                  value={courseForm.source_category}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, source_category: e.target.value })
                  }
                  placeholder="e.g. English Courses"
                />
              </label>

              <label>
                Source Order
                <input
                  type="number"
                  min="0"
                  value={courseForm.source_order}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, source_order: e.target.value })
                  }
                  placeholder="e.g. 1"
                />
              </label>

              <label>
                Language
                <select
                  value={courseForm.language}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, language: e.target.value })
                  }
                >
                  <option value="">None</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </label>

              <label>
                Domain
                <select
                  value={courseForm.domain}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, domain: e.target.value })
                  }
                >
                  <option value="">None</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                  <option value="AI & ML">AI & ML</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Business">Business</option>
                  <option value="Big Data">Big Data</option>
                  <option value="Cyber security">Cyber security</option>
                  <option value="Programming Language">Programming Language</option>
                  <option value="IOT">IOT</option>
                  <option value="VFX">VFX</option>
                  <option value="AIML">AIML</option>
                </select>
              </label>

              <label>
                Vertical
                <input
                  value={courseForm.vertical}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, vertical: e.target.value })
                  }
                  placeholder="e.g. AIML, VFX, Big Data"
                />
              </label>

              <label>
                Duration
                <input
                  value={courseForm.duration}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, duration: e.target.value })
                  }
                  placeholder="e.g. 12 Weeks"
                />
              </label>

              <label>
                Duration (Hours)
                <input
                  type="number"
                  min="0"
                  value={courseForm.duration_hours}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, duration_hours: e.target.value })
                  }
                  placeholder="e.g. 120"
                />
              </label>

              <label>
                Duration (Weeks)
                <input
                  type="number"
                  min="0"
                  value={courseForm.duration_weeks}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, duration_weeks: e.target.value })
                  }
                  placeholder="e.g. 12"
                />
              </label>

              <label>
                Fee (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={courseForm.fee}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, fee: e.target.value })
                  }
                  placeholder="e.g. 0"
                />
              </label>

              <label>
                Credits
                <input
                  type="number"
                  min="0"
                  value={courseForm.credits}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, credits: e.target.value })
                  }
                  placeholder="e.g. 4"
                />
              </label>

              <label>
                Skills / Subjects
                <input
                  value={courseForm.skills}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, skills: e.target.value })
                  }
                  placeholder="e.g. Python, Django, React"
                />
              </label>

              <label>
                Delivery Mode
                <input
                  value={courseForm.delivery_mode}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, delivery_mode: e.target.value })
                  }
                  placeholder="e.g. Self-paced"
                />
              </label>

              <label>
                Description
                <textarea
                  rows={4}
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, description: e.target.value })
                  }
                  placeholder="Describe what students will learn..."
                />
              </label>

              {courseModal.mode === "edit" && (
                <label>
                  Status
                  <select
                    value={courseForm.status}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, status: e.target.value })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              )}
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-course-cancel"
                disabled={courseSaving}
                onClick={() => setCourseModal(null)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-course-add"
                disabled={courseSaving}
              >
                {courseSaving
                  ? "Saving..."
                  : courseModal.mode === "edit"
                    ? "Save Changes"
                    : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            {confirmModal.type === "company" && (
              <div className="admin-reject-reason">
                <label htmlFor="adminRejectReason">Reason for rejection *</label>
                <textarea
                  id="adminRejectReason"
                  rows={3}
                  value={rejectReason}
                  onChange={(event) => {
                    setRejectReason(event.target.value);
                    if (event.target.value.trim()) setRejectReasonError("");
                  }}
                  placeholder="Tell the company why their verification was rejected (this is shown to them)"
                />
                {rejectReasonError && (
                  <p className="admin-reject-reason-error" style={{ margin: "6px 0 0" }}>
                    {rejectReasonError}
                  </p>
                )}
              </div>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-tab"
                onClick={() => {
                  setRejectReason("");
                  setRejectReasonError("");
                  setConfirmModal(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-reject"
                onClick={() => {
                  if (confirmModal.type === "company") {
                    if (!rejectReason.trim()) {
                      setRejectReasonError("Please enter the reason for rejection.");
                      return;
                    }
                    confirmModal.onConfirm(rejectReason.trim());
                  } else {
                    confirmModal.onConfirm();
                  }
                  setRejectReason("");
                  setRejectReasonError("");
                }}
              >
                {confirmModal.type === "issueCertificate" ? "Issue Certificate" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3>Student Profile Details</h3>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: "13px", lineHeight: "1.8", color: "#334155" }}>
              <p>
                <strong>Full Name:</strong> {selectedDetail.data.full_name}
              </p>
              <p>
                <strong>Email:</strong> {selectedDetail.data.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedDetail.data.phone || "Not provided"}
              </p>
              <p>
                <strong>Registered On:</strong> {formatDate(selectedDetail.data.created_at)}
              </p>
              <p>
                <strong>Total Course Enrollments:</strong> {selectedDetail.data.enrollment_count}
              </p>
              <p>
                <strong>Total Internship Applications:</strong> {selectedDetail.data.application_count}
              </p>
            </div>

            {selectedDetail.type === "student" && (
              <div className="admin-student-docs">
                <h4>Enrollment Documents</h4>

                {docError && (
                  <p className="admin-student-docs-error" role="alert">
                    <AlertCircle size={15} /> {docError}
                  </p>
                )}

                {(selectedDetail.data.certificate_original_name ||
                  selectedDetail.data.resume_original_name) ? (
                  <>
                    <div className="admin-doc-row">
                      <span className="admin-doc-icon"><FileCheck2 size={17} /></span>
                      <div className="admin-doc-meta" title={selectedDetail.data.certificate_original_name || ""}>
                        <span>Certificate</span>
                        <strong>
                          {selectedDetail.data.certificate_original_name
                            ? adminDocName(selectedDetail.data.certificate_original_name, 30)
                            : "Not provided"}
                        </strong>
                      </div>
                      {selectedDetail.data.certificate_original_name &&
                        selectedDetail.data.certificate_available !== false && (
                          <div className="admin-doc-actions">
                            <button
                              type="button"
                              className="admin-doc-view"
                              onClick={() =>
                                openStudentDocument(
                                  selectedDetail.data.id,
                                  "certificate",
                                  selectedDetail.data.certificate_original_name
                                )
                              }
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              type="button"
                              className="admin-doc-download"
                              title={`Download ${selectedDetail.data.certificate_original_name}`}
                              onClick={() =>
                                downloadStudentDocument(
                                  selectedDetail.data.id,
                                  "certificate",
                                  selectedDetail.data.certificate_original_name
                                )
                              }
                            >
                              <Download size={15} />
                            </button>
                          </div>
                        )}
                    </div>

                    <div className="admin-doc-row">
                      <span className="admin-doc-icon"><FileText size={17} /></span>
                      <div className="admin-doc-meta" title={selectedDetail.data.resume_original_name || ""}>
                        <span>Resume</span>
                        <strong>
                          {selectedDetail.data.resume_original_name
                            ? adminDocName(selectedDetail.data.resume_original_name, 30)
                            : "Not provided"}
                        </strong>
                      </div>
                      {selectedDetail.data.resume_original_name &&
                        selectedDetail.data.resume_available !== false && (
                          <div className="admin-doc-actions">
                            <button
                              type="button"
                              className="admin-doc-view"
                              onClick={() =>
                                openStudentDocument(
                                  selectedDetail.data.id,
                                  "resume",
                                  selectedDetail.data.resume_original_name
                                )
                              }
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              type="button"
                              className="admin-doc-download"
                              title={`Download ${selectedDetail.data.resume_original_name}`}
                              onClick={() =>
                                downloadStudentDocument(
                                  selectedDetail.data.id,
                                  "resume",
                                  selectedDetail.data.resume_original_name
                                )
                              }
                            >
                              <Download size={15} />
                            </button>
                          </div>
                        )}
                    </div>

                    {(selectedDetail.data.certificate_available === false ||
                      selectedDetail.data.resume_available === false) && (
                      <p className="admin-student-docs-warn">
                        One or more files are missing on the server. Ask the student to re-upload their documents.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="admin-student-docs-warn">
                    This student has not uploaded enrollment documents yet.
                  </p>
                )}
              </div>
            )}

            <div className="admin-modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="admin-approve"
                onClick={() => setSelectedDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {docViewer && (
        <div
          className="doc-viewer-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={closeDocViewer}
        >
          <div className="doc-viewer" onClick={(event) => event.stopPropagation()}>
            <div className="doc-viewer-header">
              <div className="doc-viewer-title">
                <FileCheck2 size={18} />
                <div>
                  <span>DOCUMENT PREVIEW (ADMIN)</span>
                  <strong title={docViewer.name}>{adminDocName(docViewer.name, 60)}</strong>
                </div>
              </div>

              <div className="doc-viewer-header-actions">
                <button
                  type="button"
                  className="enrollment-review-approve"
                  onClick={() => downloadStudentDocument(docViewer.studentId, docViewer.field, docViewer.name)}
                >
                  <Download size={16} /> Download
                </button>
                <button
                  type="button"
                  className="doc-viewer-close"
                  onClick={closeDocViewer}
                  aria-label="Close document preview"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="doc-viewer-body">
              {docViewer.kind === "pdf" ? (
                <iframe src={docViewer.url} title={`Preview of ${docViewer.name}`} />
              ) : (
                <img src={docViewer.url} alt={`Preview of ${docViewer.name}`} />
              )}
            </div>

            <p className="doc-viewer-hint">
              Original filename: <span title={docViewer.name}>{docViewer.name}</span>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
