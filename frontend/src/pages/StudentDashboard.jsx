import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  FileText,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  UserRound,
  LogOut,
  GraduationCap,
  CircleAlert,
} from "lucide-react";

import {
  getCurrentUser,
  clearCurrentUser,
} from "../services/demoStore";
import { apiRequest } from "../services/api";

const STATUS_LABELS = {
  not_submitted: "Not submitted",
  pending: "Pending review",
  approved: "Approved",
  needs_resubmission: "Needs resubmission",
  rejected: "Rejected",
};

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString();
}

function getEnrollmentTitle(item) {
  return (
    item.courseTitle ||
    item.courseName ||
    item.title ||
    item.course ||
    "Course"
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificatesList, setCertificatesList] = useState([]);
  const [documentStatus, setDocumentStatus] = useState("Not submitted");
  const [reviewerNote, setReviewerNote] = useState("");
  const [profileForm, setProfileForm] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);

    async function loadRecords() {
      try {
        const data = await apiRequest("/api/auth/profile");
        const profile = data.user || null;
        if (profile) {
          setUser((u) => ({ ...(u || {}), ...profile, fullName: profile.full_name }));
          setProfileForm({
            phone: profile.phone || "",
            education: profile.education || "",
            domain: profile.domain || "",
            college: profile.college || "",
            course: profile.course || "",
            branch: profile.branch || "",
            graduation_year: profile.graduation_year || "",
            cgpa: profile.cgpa ?? "",
            skills: profile.skills || "",
          });
        }
      } catch {
        // keep local user; profile form stays hidden
      }

      try {
        const data = await apiRequest("/api/certificates/my");
        setCertificatesList(data.certificates || []);
      } catch {
        setCertificatesList([]);
      }

      try {
        const data = await apiRequest("/api/applications/my");
        const rows = (data.applications || []).filter(
          (item) => item.kind !== "job"
        );
        setApplications(rows);
      } catch {
        setApplications([]);
      }

      try {
        const data = await apiRequest("/api/documents/my");
        const submission = data.submission || null;
        setDocumentStatus(
          STATUS_LABELS[submission?.status] || "Not submitted"
        );
        setReviewerNote(submission?.reviewer_note || "");
      } catch {
        setDocumentStatus("Not submitted");
      }

      try {
        const response = await apiRequest("/api/enrollments/my");
        const rows = Array.isArray(response)
          ? response
          : response?.enrollments || response?.data || [];

        setEnrollments(
          rows.map((item) => ({
            id: item.id,
            studentId: item.student_id ?? item.studentId ?? currentUser.id,
            courseId: item.course_id ?? item.courseId,
            courseTitle: item.title ?? item.course_title ?? item.courseTitle ?? "Course",
            category: item.domain || "IT",
            status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Enrolled",
            enrolledAt: item.enrolled_at || item.enrolledAt,
            fee: item.fee,
            credits: item.credits,
            duration: item.duration,
          }))
        );
      } catch {
        setEnrollments([]);
      }
    }

    loadRecords();
  }, [navigate]);

  function handleLogout() {
    clearCurrentUser();
    navigate("/login");
  }

  const interviews = useMemo(
    () => applications.filter((item) => (item.status || "").toLowerCase() === "interview").length,
    [applications]
  );

  const needsAttention =
    documentStatus === "Rejected" || documentStatus === "Needs resubmission";

  const certificates = useMemo(
    () => certificatesList.length,
    [certificatesList]
  );

  const profileFields = user
    ? [
        Boolean(user.fullName),
        Boolean(user.email),
        Boolean(user.education),
        Boolean(user.domain),
        Boolean(user.phone),
        Boolean(user.skills && (Array.isArray(user.skills) ? user.skills.length : String(user.skills).trim())),
      ]
    : [];

  const profileCompletion = profileFields.length
    ? Math.round(
        (profileFields.filter(Boolean).length / profileFields.length) * 100
      )
    : 0;

  if (!user) {
    return null;
  }

  const stats = [
    { label: "Courses Enrolled", value: enrollments.length, icon: BookOpen },
    { label: "Applications", value: applications.length, icon: FileText },
    { label: "Interviews", value: interviews, icon: Clock },
    { label: "Certificates", value: certificates, icon: Award },
  ];

  const steps = [
    {
      title: "Complete your profile",
      detail:
        profileCompletion === 100
          ? "Your basic profile details are complete."
          : "Add your education, interested domain, phone number, and skills where available.",
    },
    {
      title: "Explore courses",
      detail:
        enrollments.length > 0
          ? `You have enrolled in ${enrollments.length} course(s).`
          : "Choose a course to begin learning.",
    },
    {
      title: "Find internships",
      detail:
        applications.length > 0
          ? `You have submitted ${applications.length} application(s).`
          : "Discover internships matching your interests.",
    },
    {
      title: "Track your progress",
      detail: "Review your learning records and internship application statuses below.",
    },
  ];

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">STUDENT PORTAL</span>
          <h1>Welcome, {user.fullName || "Student"}!</h1>
          <p>
            Continue your learning and career journey with Future Akshitha.
          </p>
          <p className="dashboard-welcome-meta">
            <GraduationCap size={16} /> {user.education || "Education not added"}
            {" · "}
            {user.domain || "Domain not selected"}
          </p>
        </div>

        <div className="dashboard-avatar" aria-hidden="true">
          <UserRound size={30} />
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Student summary">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="dashboard-stat" key={label}>
            <div className="dashboard-stat-icon">
              <Icon size={23} />
            </div>
            <div>
              <h2>{value}</h2>
              <p>{label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Profile Completion</h2>
            <p>Complete your basic details to help companies understand your background.</p>
          </div>
          <UserRound size={24} />
        </div>
        <div
          role="progressbar"
          aria-label="Profile completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={profileCompletion}
          style={{
            width: "100%",
            height: "10px",
            borderRadius: "999px",
            background: "rgba(148, 163, 184, 0.22)",
            overflow: "hidden",
            margin: "14px 0 8px",
          }}
        >
          <div
            style={{
              width: `${profileCompletion}%`,
              height: "100%",
              borderRadius: "999px",
              background: "linear-gradient(90deg, #c5a35a, #e5cc86)",
              transition: "width 200ms ease",
            }}
          />
        </div>
        <p><strong>{profileCompletion}% complete</strong></p>

        <button
          type="button"
          className="dashboard-action"
          onClick={() => setShowProfileForm((v) => !v)}
        >
          {showProfileForm ? "Close Profile Editor" : "Edit My Profile"}
        </button>

        {showProfileForm && profileForm && (
          <form
            className="dashboard-profile-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileSaving(true);
              setProfileMessage(null);
              try {
                const data = await apiRequest("/api/auth/profile", {
                  method: "PUT",
                  body: JSON.stringify({
                    phone: profileForm.phone,
                    education: profileForm.education || null,
                    domain: profileForm.domain || null,
                    college: profileForm.college,
                    course: profileForm.course,
                    branch: profileForm.branch,
                    graduation_year: profileForm.graduation_year === "" ? null : Number(profileForm.graduation_year),
                    cgpa: profileForm.cgpa === "" ? null : Number(profileForm.cgpa),
                    skills: profileForm.skills,
                  }),
                });
                setUser((u) => ({ ...u, ...data.user, fullName: data.user.full_name }));
                setShowProfileForm(false);
                setProfileMessage({ type: "ok", text: "Profile updated successfully." });
              } catch (error) {
                setProfileMessage({ type: "error", text: error.message || "Unable to update profile." });
              } finally {
                setProfileSaving(false);
              }
            }}
          >
            <label>Phone
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="Phone number"
              />
            </label>

            <label>Highest Education
              <select
                value={profileForm.education}
                onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
              >
                <option value="">Select education</option>
                {["10th", "12th", "Intermediate", "Diploma", "Degree", "Graduate", "Postgraduate"].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            <label>Interested Domain
              <select
                value={profileForm.domain}
                onChange={(e) => setProfileForm({ ...profileForm, domain: e.target.value })}
              >
                <option value="">Select domain</option>
                <option value="IT">IT</option>
                <option value="Non-IT">Non-IT</option>
              </select>
            </label>

            <label>College
              <input
                type="text"
                value={profileForm.college}
                onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                placeholder="College name"
              />
            </label>

            <label>Course
              <input
                type="text"
                value={profileForm.course}
                onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })}
                placeholder="e.g. B.Tech"
              />
            </label>

            <label>Branch
              <input
                type="text"
                value={profileForm.branch}
                onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </label>

            <label>Graduation Year
              <input
                type="number"
                value={profileForm.graduation_year}
                onChange={(e) => setProfileForm({ ...profileForm, graduation_year: e.target.value })}
                placeholder="e.g. 2026"
                min="1980"
                max="2100"
              />
            </label>

            <label>CGPA
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profileForm.cgpa}
                onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                placeholder="0.00 - 10.00"
              />
            </label>

            <label className="dashboard-profile-full">Skills (comma separated)
              <input
                type="text"
                value={profileForm.skills}
                onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                placeholder="e.g. React, Python, SQL"
              />
            </label>

            <button type="submit" disabled={profileSaving} className="dashboard-action">
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        )}

        {profileMessage && (
          <p
            role="status"
            style={{
              margin: "10px 4% 0",
              color: profileMessage.type === "error" ? "#fca5a5" : "#86e0a4",
              fontWeight: 600,
            }}
          >
            {profileMessage.text}
          </p>
        )}
      </section>

      <section className="dashboard-panel dashboard-verification">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Enrollment Verification</h2>
            <p>Track your placement training document review.</p>
          </div>
          {documentStatus === "Approved" ? (
            <CheckCircle2 size={25} />
          ) : (
            <Clock size={25} />
          )}
        </div>

          {documentStatus !== "Not submitted" && (
            <p><strong>Current document status:</strong> {documentStatus}</p>
          )}
          {needsAttention && reviewerNote && (
            <p><strong>Reviewer feedback:</strong> {reviewerNote}</p>
          )}

          <p>
            {documentStatus === "Approved"
              ? "Your documents have been approved by the administration."
              : documentStatus === "Not submitted"
                ? "Submit your completion certificate and resume to begin placement training verification."
                : "Your document submission is being processed by the administration."}
          </p>

        <Link to="/enrollment-verification" className="dashboard-action">
          View Enrollment Details <ArrowRight size={17} />
        </Link>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Your Next Steps</h2>
              <p>Follow these steps to get started.</p>
            </div>
            <CheckCircle2 size={24} />
          </div>

          <div className="dashboard-steps">
            {steps.map((step, index) => (
              <div className="dashboard-step" key={step.title}>
                <span className="step-number">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-profile-info">
            <h3>Account Information</h3>
            <p><strong>Name:</strong> {user.full_name || user.fullName || "Not provided"}</p>
            <p><strong>Email:</strong> {user.email || "Not provided"}</p>
            <p><strong>Education:</strong> {user.education || "Not provided"}</p>
            <p><strong>Interested domain:</strong> {user.domain || "Not selected"}</p>
            <p><strong>College:</strong> {user.college || "Not provided"}</p>
            <p><strong>Course / Branch:</strong> {user.course || "Not provided"}{user.branch ? ` - ${user.branch}` : ""}</p>
            <p><strong>Graduation year:</strong> {user.graduation_year || "Not provided"}</p>
            <p><strong>CGPA:</strong> {user.cgpa !== null && user.cgpa !== undefined ? user.cgpa : "Not provided"}</p>
            <p><strong>Skills:</strong> {user.skills || "Not provided"}</p>
          </div>
        </div>

        <div className="dashboard-panel dashboard-actions">
          <h2>Quick Actions</h2>
          <p>Continue building your future.</p>

          <Link to="/courses" className="dashboard-action">
            <BookOpen size={20} />
            <span>Explore Courses</span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/#internships" className="dashboard-action">
            <BriefcaseBusiness size={20} />
            <span>Find Internships</span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/learning-journey" className="dashboard-action">
            <GraduationCap size={20} />
            <span>View Learning Journey</span>
            <ArrowRight size={17} />
          </Link>

          <button
            type="button"
            className="dashboard-action"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
            <ArrowRight size={17} />
          </button>

          <div className="dashboard-tip">
            <Award size={22} />
            <div>
              <strong>Your goal matters</strong>
              <p>Keep learning and take one step forward every day.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel dashboard-records">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Learning</h2>
            <p>Review the courses you have enrolled in.</p>
          </div>
          <BookOpen size={23} />
        </div>

        {enrollments.length === 0 ? (
          <div className="dashboard-empty">
            <BookOpen size={28} />
            <h3>No courses enrolled yet</h3>
            <p>Explore the course catalogue and enroll in a course to get started.</p>
            <Link to="/courses" className="dashboard-action">
              Explore Courses <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          enrollments.map((item, index) => (
            <article
              className="dashboard-record"
              key={item.id || `${getEnrollmentTitle(item)}-${index}`}
            >
              <div>
                <h3>{getEnrollmentTitle(item)}</h3>
                {item.category && <p><strong>Category:</strong> {item.category}</p>}
                {item.credits && <p><strong>Credits:</strong> {item.credits}</p>}
                {item.enrolledAt && (
                  <p><strong>Enrolled:</strong> {formatDate(item.enrolledAt)}</p>
                )}
              </div>
              <span className="dashboard-record-status">
                {item.status || "Enrolled"}
              </span>
            </article>
          ))
        )}
      </section>

      <section className="dashboard-panel dashboard-records">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Internship Applications</h2>
            <p>Track the opportunities you have applied for.</p>
          </div>
          <BriefcaseBusiness size={23} />
        </div>

        {applications.length === 0 ? (
          <div className="dashboard-empty">
            <BriefcaseBusiness size={28} />
            <h3>No applications yet</h3>
            <p>Explore internships and apply for suitable opportunities.</p>
            <Link to="/#internships" className="dashboard-action">
              Find Internships <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          applications.map((item, index) => (
            <article
              className="dashboard-record"
              key={item.id || `${item.internship_id || item.title || "application"}-${index}`}
            >
              <div>
                <h3>{item.title || "Opportunity"}</h3>
                {item.kind && (
                  <p><strong>Type:</strong> {item.kind === "job" ? "Job" : "Internship"}</p>
                )}
                <p>
                  <strong>Company:</strong> {item.company_name || "Company not specified"}
                </p>
                <p>
                  <strong>Applied:</strong> {formatDate(item.applied_at)}
                </p>
                {item.location && (
                  <p><strong>Location:</strong> {item.location}</p>
                )}
              </div>
              <span className="dashboard-record-status">
                {(item.status || "applied").charAt(0).toUpperCase() + (item.status || "applied").slice(1)}
              </span>
            </article>
          ))
        )}
      </section>

      <section className="dashboard-panel dashboard-records">
        <div className="dashboard-panel-heading">
          <div>
            <h2>My Certificates</h2>
            <p>Completion certificates issued by the administration.</p>
          </div>
          <Award size={23} />
        </div>

        {certificatesList.length === 0 ? (
          <div className="dashboard-empty">
            <Award size={28} />
            <h3>No certificates yet</h3>
            <p>Certificates appear here once your course or internship is completed and verified.</p>
          </div>
        ) : (
          certificatesList.map((item) => (
            <article className="dashboard-record" key={item.id}>
              <div>
                <h3>{item.title}</h3>
                <p><strong>Type:</strong> {item.source === "course" ? "Course completion" : "Internship completion"}</p>
                <p>
                  <strong>Certificate no:</strong> {item.certificate_no}
                </p>
                <p><strong>Issued:</strong> {formatDate(item.issued_at)}</p>
                {item.note && <p>{item.note}</p>}
              </div>
              <span className="dashboard-record-status">Issued</span>
            </article>
          ))
        )}
      </section>

      {needsAttention && (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Document Review Needs Attention</h2>
              <p>Your placement training documents were not approved. Please review the feedback or contact the training team.</p>
            </div>
            <CircleAlert size={24} />
          </div>
          <Link to="/enrollment-verification" className="dashboard-action">
            Review Documents <ArrowRight size={17} />
          </Link>
        </section>
      )}
    </main>
  );
}
