import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CheckCircle2, Clock, FileCheck2, FileText, GraduationCap,
  ShieldCheck, Upload, AlertCircle, RefreshCw,
} from "lucide-react";

import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/demoStore";

const EDUCATION_OPTIONS = ["10th", "12th", "Intermediate", "Diploma", "Degree", "Graduate", "Postgraduate"];

const STATUS_LABELS = {
  not_submitted: "Not submitted",
  pending: "Pending review",
  approved: "Approved",
  needs_resubmission: "Needs resubmission",
  rejected: "Rejected",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function validateFile(file, allowedExtensions) {
  if (!file) return "Please select a file.";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) return `Allowed file types: ${allowedExtensions.join(", ")}.`;
  if (file.size > 5 * 1024 * 1024) return "Each file must be 5 MB or smaller.";
  return "";
}

export default function EnrollmentVerification() {
  const user = getCurrentUser();
  const isStudent = user?.role?.toLowerCase() === "student";

  const [submission, setSubmission] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [education, setEducation] = useState("");
  const [completionCertificate, setCompletionCertificate] = useState(null);
  const [resume, setResume] = useState(null);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isStudent) return undefined;
    let cancelled = false;

    apiRequest("/api/documents/my")
      .then((data) => {
        if (cancelled) return;
        setSubmission(data.submission || null);
        if (data.submission?.education) {
          setEducation(data.submission.education);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || "");
      });

    return () => { cancelled = true; };
  }, [isStudent]);

  const currentStatus = submission?.status || "not_submitted";
  const statusLabel = STATUS_LABELS[currentStatus] || currentStatus;
  const needsResubmission = ["needs_resubmission", "rejected"].includes(currentStatus);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!isStudent) {
      setError("Sign in with a student account before submitting documents.");
      return;
    }
    if (!education) {
      setError("Please select your highest education.");
      return;
    }

    const certificateToValidate = completionCertificate;
    const resumeToValidate = resume;

    if (!certificateToValidate || !resumeToValidate) {
      setError("Please upload both your completion certificate and resume.");
      return;
    }

    const certificateError = validateFile(certificateToValidate, ["pdf", "jpg", "jpeg", "png"]);
    if (certificateError) return setError(`Completion certificate: ${certificateError}`);
    const resumeError = validateFile(resumeToValidate, ["pdf", "doc", "docx"]);
    if (resumeError) return setError(`Resume: ${resumeError}`);

    if (!confirmation) {
      setError("Please confirm that your information is accurate.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("education", education);
      formData.append("certificate", completionCertificate);
      formData.append("resume", resume);

      const data = await apiRequest("/api/documents/submit", {
        method: "POST",
        body: formData,
      });

      setNotice(data.message || "Your documents have been submitted for verification.");
      setCompletionCertificate(null);
      setResume(null);
      setConfirmation(false);

      const refreshed = await apiRequest("/api/documents/my");
      setSubmission(refreshed.submission || null);
    } catch (err) {
      setError(err.message || "Unable to submit your documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="enrollment-page">
      <section className="enrollment-hero">
        <span className="enrollment-eyebrow"><ShieldCheck size={16} /> STUDENT ENROLLMENT</span>
        <h1>Complete your enrollment</h1>
        <p>Submit your education details and documents to begin the placement training verification process.</p>
        <div className="enrollment-hero-pills">
          <span><FileCheck2 size={16} /> Document checklist</span>
          <span><Clock size={16} /> Verification tracking</span>
        </div>
      </section>

      {!user && (
        <div className="enrollment-message enrollment-error" role="alert">
          <AlertCircle size={19} />
          <div><strong>Sign in required</strong><p>Sign in with your student account to submit enrollment documents.</p><Link to="/login">Go to login <ArrowRight size={15} /></Link></div>
        </div>
      )}

      {user && !isStudent && (
        <div className="enrollment-message enrollment-error" role="alert">
          <AlertCircle size={19} /><div><strong>Student account required</strong><p>This page is intended for student enrollment submissions.</p></div>
        </div>
      )}

      {isStudent && loadError && (
        <div className="enrollment-message enrollment-error" role="alert">
          <AlertCircle size={19} />
          <div><strong>Unable to load your status</strong><p>{loadError}</p></div>
        </div>
      )}

      {isStudent && !loadError && (
        <section className="enrollment-status-panel" aria-live="polite">
          <div className="enrollment-status-icon">
            {currentStatus === "approved" ? <CheckCircle2 size={24} /> : needsResubmission ? <RefreshCw size={24} /> : <Clock size={24} />}
          </div>
          <div className="enrollment-status-copy">
            <span className="enrollment-label">DOCUMENT STATUS</span>
            <h2>{statusLabel}</h2>
            <p>{currentStatus === "approved"
              ? "Your documents have been approved by the administration."
              : needsResubmission
                ? "Review the administrator's feedback and upload corrected documents."
                : currentStatus === "pending"
                  ? "Your submission is waiting for an administrator to review it."
                  : "Submit your details and documents to begin the review process."}</p>
            {submission?.reviewer_note && <p className="enrollment-review-note"><strong>Reviewer feedback:</strong> {submission.reviewer_note}</p>}
            {submission?.submitted_at && <p className="enrollment-submitted-date">Last submitted: {formatDate(submission.submitted_at)}</p>}
          </div>
          <span className={`enrollment-status-badge ${currentStatus === "approved" ? "status-approved" : needsResubmission ? "status-revision" : "status-pending"}`}>{statusLabel}</span>
        </section>
      )}

      <form className="enrollment-form" onSubmit={handleSubmit}>
        <div className="enrollment-form-heading">
          <div className="enrollment-heading-icon"><GraduationCap size={25} /></div>
          <div><h2>Enrollment information</h2><p>Files are uploaded securely to the platform (PDF/JPG/PNG for certificates, PDF/DOC/DOCX for resumes, max 5 MB).</p></div>
        </div>

        <div className="enrollment-form-grid">
          <div className="enrollment-field"><label htmlFor="enrollmentName">Student name</label><input id="enrollmentName" value={user?.fullName || user?.full_name || ""} readOnly placeholder="Sign in to view your name" /></div>
          <div className="enrollment-field"><label htmlFor="enrollmentEmail">Email address</label><input id="enrollmentEmail" type="email" value={user?.email || ""} readOnly placeholder="Sign in to view your email" /></div>
          <div className="enrollment-field enrollment-field-full">
            <label htmlFor="enrollmentEducation">Highest education <span>*</span></label>
            <select id="enrollmentEducation" value={education} onChange={(event) => { setEducation(event.target.value); setError(""); }} required disabled={!isStudent}>
              <option value="">Select your highest education</option>
              {EDUCATION_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </div>
        </div>

        <div className="enrollment-upload-section">
          <h3>Required documents</h3><p>Choose the files from your device. Maximum size: 5 MB per file.</p>
          <div className="enrollment-upload-grid">
            <div className="enrollment-upload-card">
              <div className="enrollment-upload-icon"><FileCheck2 size={23} /></div>
              <label htmlFor="completionCertificate">Completion certificate <span>*</span> <em className="enrollment-required-tag">Mandatory</em></label><p>PDF, JPG, JPEG or PNG</p>
              {submission?.certificate_original_name && <p className="enrollment-existing-file">Previously submitted: {submission.certificate_original_name}</p>}
              <input id="completionCertificate" type="file" accept=".pdf,.jpg,.jpeg,.png" required disabled={!isStudent} onChange={(event) => { setCompletionCertificate(event.target.files?.[0] || null); setError(""); }} />
              {completionCertificate && <div className="enrollment-file-selected"><CheckCircle2 size={16} /> {completionCertificate.name}</div>}
            </div>
            <div className="enrollment-upload-card">
              <div className="enrollment-upload-icon"><FileText size={23} /></div>
              <label htmlFor="enrollmentResume">Resume <span>*</span> <em className="enrollment-required-tag">Mandatory</em></label><p>PDF, DOC or DOCX</p>
              {submission?.resume_original_name && <p className="enrollment-existing-file">Previously submitted: {submission.resume_original_name}</p>}
              <input id="enrollmentResume" type="file" accept=".pdf,.doc,.docx" required disabled={!isStudent} onChange={(event) => { setResume(event.target.files?.[0] || null); setError(""); }} />
              {resume && <div className="enrollment-file-selected"><CheckCircle2 size={16} /> {resume.name}</div>}
            </div>
          </div>
        </div>

        <label className="enrollment-confirmation">
          <input type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} disabled={!isStudent} />
          <span>I confirm that the information provided is accurate and that these documents belong to me.</span>
        </label>

        {error && <div className="enrollment-message enrollment-error" role="alert"><AlertCircle size={19} /> {error}</div>}
        {notice && <div className="enrollment-message enrollment-success" role="status"><CheckCircle2 size={19} /> {notice}</div>}

        <div className="enrollment-form-actions">
          <Link to="/placement-training" className="enrollment-back-link">Back to Placement &amp; Training</Link>
          <button type="submit" className="enrollment-submit" disabled={!isStudent || isSubmitting}>
            <Upload size={17} /> {isSubmitting ? "Uploading securely..." : needsResubmission ? "Resubmit documents" : "Submit for verification"}
          </button>
        </div>
      </form>

      <p className="enrollment-security-note"><ShieldCheck size={16} /> Your documents are stored privately on the platform server and are only visible to you and authorized administrators.</p>
    </main>
  );
}
