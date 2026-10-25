import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileCheck2,
  FileText,
  RefreshCw,
  RotateCcw,
  Download,
} from "lucide-react";

import { API_BASE_URL, apiRequest, getStoredToken } from "../services/api";

const STATUS_LABELS = {
  not_submitted: "Not submitted",
  pending: "Pending review",
  approved: "Approved",
  needs_resubmission: "Needs resubmission",
  rejected: "Rejected",
};

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN");
}

function supportedKind(originalName) {
  const extension = String(originalName || "")
    .split(".")
    .pop()
    ?.toLowerCase();

  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png"].includes(extension)) return "image";
  return null;
}

function docName(originalName, maxLength = 30) {
  const name = String(originalName || "").trim();
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength - 1)}…`;
}

export default function EnrollmentReview() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState({});
  const [viewer, setViewer] = useState(null);

  async function loadSubmissions() {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/documents/admin/all");
      setSubmissions(data.submissions || []);
    } catch (err) {
      setLoadError(err.message || "Unable to load submissions.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function updateStatus(studentId, nextStatus, currentNote) {
    setMessage("");
    setErrorMessage("");

    const note = (reviewNotes[studentId] ?? currentNote ?? "").trim();
    if (nextStatus !== "approved" && !note) {
      setErrorMessage(
        "Please add a review note before requesting changes or rejecting a submission."
      );
      return;
    }

    try {
      const data = await apiRequest(`/api/documents/admin/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note }),
      });
      setMessage(data.message || "Review updated.");
      await loadSubmissions();
    } catch (err) {
      setErrorMessage(err.message || "Unable to update the review.");
    }
  }

  async function fetchDocument(studentId, field, originalName) {
    if (!getStoredToken()) {
      throw new Error("You need to sign in as an administrator first.");
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
        // Non-JSON error response: keep the default message.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const kind = supportedKind(originalName);
    return { blob, kind };
  }

  async function downloadDocument(studentId, field, originalName) {
    setMessage("");
    setErrorMessage("");

    try {
      const { blob } = await fetchDocument(studentId, field, originalName);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName || `document-${field}-${studentId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setErrorMessage(err.message || "Unable to open the document right now.");
    }
  }

  async function viewDocument(studentId, field, originalName) {
    setMessage("");
    setErrorMessage("");

    if (!supportedKind(originalName)) {
      setErrorMessage(
        `"${originalName}" is not previewable. Please use the Download action instead.`
      );
      return;
    }

    try {
      const { blob, kind } = await fetchDocument(studentId, field, originalName);
      setViewer({
        url: URL.createObjectURL(blob),
        kind,
        name: originalName,
        studentId,
        field,
      });
    } catch (err) {
      setErrorMessage(err.message || "Unable to open the document right now.");
    }
  }

  function closeViewer() {
    if (viewer?.url) {
      URL.revokeObjectURL(viewer.url);
    }
    setViewer(null);
  }

  const filteredSubmissions = submissions.filter((item) => {
    const haystack =
      `${item.full_name || ""} ${item.email || ""}`.toLowerCase();
    return (
      haystack.includes(search.trim().toLowerCase()) &&
      (status === "All" || item.status === status)
    );
  });

  const pendingCount = submissions.filter((item) => item.status === "pending").length;
  const approvedCount = submissions.filter((item) => item.status === "approved").length;
  const rejectedCount = submissions.filter(
    (item) => item.status === "rejected" || item.status === "needs_resubmission"
  ).length;

  return (
    <main className="enrollment-review-page">
      <section className="enrollment-review-header">
        <div>
          <span className="placement-eyebrow">ADMINISTRATION</span>
          <h1>Enrollment Verification</h1>
          <p>Review student enrollment submissions and update their verification status.</p>
        </div>
        <button type="button" className="placement-secondary-btn" onClick={loadSubmissions}>
          <RefreshCw size={17} /> Refresh
        </button>
      </section>

      <section className="enrollment-review-stats">
        <article><Clock size={22} /><span>Pending Review</span><strong>{pendingCount}</strong></article>
        <article><CheckCircle size={22} /><span>Approved</span><strong>{approvedCount}</strong></article>
        <article><XCircle size={22} /><span>Rejected / Changes</span><strong>{rejectedCount}</strong></article>
        <article><ClipboardCheck size={22} /><span>Total Submissions</span><strong>{submissions.length}</strong></article>
      </section>

      <section className="enrollment-review-list">
        <div className="enrollment-review-toolbar">
          <label className="enrollment-review-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by student name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter submissions by status"
          >
            <option value="All">All submissions</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="needs_resubmission">Needs resubmission</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {message && <p className="enrollment-review-message" role="status">{message}</p>}
        {errorMessage && (
          <p className="enrollment-review-message" role="alert" style={{ color: "#b91c1c" }}>
            {errorMessage}
          </p>
        )}

        {isLoading && (
          <div className="enrollment-review-empty" role="status">
            <RefreshCw size={30} />
            <h2>Loading submissions…</h2>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="enrollment-review-empty" role="alert">
            <XCircle size={34} />
            <h2>Unable to load submissions</h2>
            <p>{loadError}</p>
            <button type="button" className="placement-secondary-btn" onClick={loadSubmissions}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !loadError && filteredSubmissions.length === 0 && (
          <div className="enrollment-review-empty">
            <FileText size={42} />
            <h2>{submissions.length ? "No matching submissions" : "No submissions yet"}</h2>
            <p>
              {submissions.length
                ? "Try changing your search or status filter."
                : "Student submissions will appear here after they complete the enrollment verification form."}
            </p>
          </div>
        )}

        {!isLoading && !loadError && filteredSubmissions.length > 0 && (
          <div className="enrollment-review-cards">
            {filteredSubmissions.map((item) => (
              <article className="enrollment-review-card" key={item.id}>
                <div className="enrollment-review-card-top">
                  <div>
                    <h2>{item.full_name || "Student"}</h2>
                    <p>{item.email || "No email provided"}</p>
                  </div>
                  <span className={`enrollment-review-status ${String(item.status || "pending").toLowerCase().replace(/\\s+/g, "-")}`}>
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                </div>

                <div className="enrollment-review-details">
                  <div className="enrollment-review-field">
                    <span>Education</span>
                    <p>{item.education || "Not provided"}</p>
                  </div>

                  <div className="enrollment-review-field">
                    <span>Submitted</span>
                    <p>{formatDate(item.submitted_at)}</p>
                  </div>

                  {item.reviewed_at && (
                    <div className="enrollment-review-field">
                      <span>Reviewed</span>
                      <p>{formatDate(item.reviewed_at)}</p>
                    </div>
                  )}
                </div>

                <div className="enrollment-review-doc-panel">
                  <h3>Documents</h3>

                  <div className="enrollment-review-doc-row">
                    <span className="enrollment-review-doc-icon">
                      <FileCheck2 size={20} />
                    </span>

                    <div className="enrollment-review-doc-meta">
                      <span>Certificate</span>
                      {item.certificate_original_name ? (
                        item.certificate_available === false ? (
                          <p className="enrollment-review-doc-missing" title={item.certificate_original_name}>
                            Missing on server – student must re-upload
                          </p>
                        ) : (
                          <p title={item.certificate_original_name}>
                            {docName(item.certificate_original_name, 30)}
                          </p>
                        )
                      ) : (
                        <p className="enrollment-review-doc-missing">
                          Not provided
                        </p>
                      )}
                    </div>

                    {item.certificate_original_name && item.certificate_available !== false && (
                      <div className="enrollment-review-doc-buttons">
                        <button
                          type="button"
                          className="enrollment-review-doc-open"
                          onClick={() =>
                            viewDocument(item.student_id, "certificate", item.certificate_original_name)
                          }
                        >
                          <Eye size={15} /> View
                        </button>

                        <button
                          type="button"
                          className="enrollment-review-doc-download"
                          title={`Download ${item.certificate_original_name}`}
                          aria-label={`Download certificate of ${item.full_name || "student"}`}
                          onClick={() =>
                            downloadDocument(item.student_id, "certificate", item.certificate_original_name)
                          }
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="enrollment-review-doc-row">
                    <span className="enrollment-review-doc-icon">
                      <FileText size={20} />
                    </span>

                    <div className="enrollment-review-doc-meta">
                      <span>Resume</span>
                      {item.resume_original_name ? (
                        item.resume_available === false ? (
                          <p className="enrollment-review-doc-missing" title={item.resume_original_name}>
                            Missing on server – student must re-upload
                          </p>
                        ) : (
                          <p title={item.resume_original_name}>
                            {docName(item.resume_original_name, 30)}
                          </p>
                        )
                      ) : (
                        <p className="enrollment-review-doc-missing">
                          Not provided
                        </p>
                      )}
                    </div>

                    {item.resume_original_name && item.resume_available !== false && (
                      <div className="enrollment-review-doc-buttons">
                        <button
                          type="button"
                          className="enrollment-review-doc-open"
                          onClick={() =>
                            viewDocument(item.student_id, "resume", item.resume_original_name)
                          }
                        >
                          <Eye size={15} /> View
                        </button>

                        <button
                          type="button"
                          className="enrollment-review-doc-download"
                          title={`Download ${item.resume_original_name}`}
                          aria-label={`Download resume of ${item.full_name || "student"}`}
                          onClick={() =>
                            downloadDocument(item.student_id, "resume", item.resume_original_name)
                          }
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {item.reviewer_note && (
                  <p className="enrollment-review-note"><strong>Review note:</strong> {item.reviewer_note}</p>
                )}

                <div className="enrollment-review-note-field">
                  <label htmlFor={`review-note-${item.id}`}>Reviewer note</label>
                  <textarea
                    id={`review-note-${item.id}`}
                    rows={5}
                    maxLength={500}
                    placeholder="Add feedback for the student (required for resubmission or rejection)"
                    value={reviewNotes[item.student_id] ?? (item.reviewer_note || "")}
                    onChange={(event) => {
                      setReviewNotes((previous) => ({
                        ...previous,
                        [item.student_id]: event.target.value,
                      }));
                      setErrorMessage("");
                    }}
                  />
                </div>

                <div className="enrollment-review-actions">
                  <button
                    type="button"
                    className="enrollment-review-approve"
                    onClick={() => updateStatus(item.student_id, "approved", item.reviewer_note)}
                    disabled={item.status === "approved"}
                  >
                    <CheckCircle size={17} /> Approve
                  </button>
                  <button
                    type="button"
                    className="enrollment-review-changes"
                    onClick={() => updateStatus(item.student_id, "needs_resubmission", item.reviewer_note)}
                    disabled={item.status === "needs_resubmission"}
                  >
                    <RotateCcw size={17} /> Request changes
                  </button>
                  <button
                    type="button"
                    className="enrollment-review-reject"
                    onClick={() => updateStatus(item.student_id, "rejected", item.reviewer_note)}
                    disabled={item.status === "rejected"}
                  >
                    <XCircle size={17} /> Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {viewer && (
        <div
          className="doc-viewer-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${viewer.name}`}
          onClick={closeViewer}
        >
          <div
            className="doc-viewer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="doc-viewer-header">
              <div className="doc-viewer-title">
                <FileCheck2 size={18} />
                <div>
                  <span>DOCUMENT PREVIEW (ADMIN)</span>
                  <strong title={viewer.name}>{docName(viewer.name, 60)}</strong>
                </div>
              </div>

              <div className="doc-viewer-header-actions">
                <button
                  type="button"
                  className="enrollment-review-approve"
                  onClick={() =>
                    downloadDocument(viewer.studentId, viewer.field, viewer.name)
                  }
                >
                  <Download size={16} /> Download
                </button>
                <button
                  type="button"
                  className="doc-viewer-close"
                  onClick={closeViewer}
                  aria-label="Close document preview"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="doc-viewer-body">
              {viewer.kind === "pdf" ? (
                <iframe
                  src={viewer.url}
                  title={`Preview of ${viewer.name}`}
                />
              ) : (
                <img src={viewer.url} alt={`Preview of ${viewer.name}`} />
              )}
            </div>

            <p className="doc-viewer-hint">
              Original filename: <span title={viewer.name}>{viewer.name}</span>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
