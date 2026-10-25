import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  BriefcaseBusiness,
  Users,
  Clock,
  Plus,
  MapPin,
  X,
  Trash2,
  CheckCircle2,
  Search,
  AlertCircle,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";

import { API_BASE_URL, apiRequest, getStoredToken } from "../services/api";
import { getCurrentUser } from "../services/demoStore";
import ConfirmModal from "../components/ConfirmModal";

const VALID_TRANSITIONS = {
  applied: ["shortlisted", "interview", "rejected"],
  shortlisted: ["interview", "selected", "rejected"],
  interview: ["selected", "rejected"],
  selected: ["joined", "rejected"],
  joined: ["completed"],
  completed: [],
  rejected: [],
};

const STAGE_LABELS = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  joined: "Joined",
  completed: "Completed",
  rejected: "Rejected",
};

const EMPTY_FORM = {
  title: "",
  domain: "IT",
  workType: "Remote",
  duration: "3 months",
  location: "Remote",
  description: "",
  skills: "",
  eligibility: "",
  stipend: "",
  applicationDeadline: "",
  kind: "internship",
};

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN");
}

export default function CompanyDashboard() {
  const user = getCurrentUser();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    company_name: "",
    website: "",
    description: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [viewApplicant, setViewApplicant] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mainNotice, setMainNotice] = useState("");
  const [mainError, setMainError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [savingInternship, setSavingInternship] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirm, setConfirm] = useState(null);

  const isVerified = profile?.verification_status === "approved";

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      try {
        const data = await apiRequest("/api/companies/profile");
        if (!cancelled) setProfile(data.company || null);
      } catch (err) {
        if (cancelled) return;
        setProfile(null);
        if (err.status !== 404) {
          setProfileError(err.message || "Unable to load company profile.");
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, []);

  async function handleCreateProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError("");

    try {
      const data = await apiRequest("/api/companies/profile", {
        method: "POST",
        body: JSON.stringify(profileForm),
      });
      setProfile(data.company || null);
    } catch (err) {
      setProfileError(err.message || "Unable to save your company profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function openEditProfile() {
    setEditForm({
      company_name: profile.company_name || "",
      website: profile.website || "",
      description: profile.description || "",
    });
    setEditProfileOpen(true);
  }

  async function handleEditProfile(event) {
    event.preventDefault();
    setEditSaving(true);
    try {
      const data = await apiRequest("/api/companies/profile", {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      setProfile(data.company || null);
      setProfileError("");
      setEditProfileOpen(false);
    } catch (err) {
      setProfileError(err.message || "Unable to update company profile.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleViewApplicant(applicationId) {
    setViewError("");
    setViewApplicant(null);
    setViewLoading(true);
    try {
      const data = await apiRequest(`/api/applications/company/${applicationId}`);
      setViewApplicant(data.application || null);
    } catch (err) {
      setViewError(err.message || "Unable to load applicant details.");
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDownloadResume(viewerStudentId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/documents/resume/${viewerStudentId}`,
        {
          headers: { Authorization: `Bearer ${getStoredToken()}` },
        }
      );
      if (!response.ok) throw new Error("Resume is not available for this applicant.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = viewApplicant?.full_name ? `${viewApplicant.full_name}-resume` : "resume";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setViewError(err.message || "Unable to download resume.");
    }
  }

  async function loadListings() {
    setIsLoading(true);
    setLoadError("");
    try {
      const [internshipRes, applicationRes] = await Promise.all([
        apiRequest("/api/internships/my"),
        apiRequest("/api/applications/company"),
      ]);
      setInternships(internshipRes.internships || []);
      setApplications(applicationRes.applications || []);
    } catch (err) {
      setLoadError(err.message || "Unable to load your listings and applicants.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (profile) {
      loadListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.verification_status]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  }

  async function handlePublish(event) {
    event.preventDefault();
    setMainNotice("");
    setMainError("");
    setFormError("");

    if (!isVerified) {
      setFormError(
        "Your company must be verified before you can publish opportunities."
      );
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setFormError("Please enter the title and description.");
      return;
    }

    const stipend = form.stipend.trim();
    if (stipend && !/^\d+(\.\d{1,2})?$/.test(stipend)) {
      setFormError("Stipend must be a number (INR per month) or empty.");
      return;
    }

    setSavingInternship(true);

    try {
      const data = await apiRequest("/api/internships", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          location: form.location,
          stipend: stipend === "" ? null : Number(stipend),
          duration: form.duration,
          application_deadline: form.applicationDeadline || null,
          domain: form.domain,
          work_type: form.workType,
          skills: form.skills,
          eligibility: form.eligibility,
          kind: form.kind === "job" ? "job" : "internship",
        }),
      });

      setMainNotice(data.message || "Listing published.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadListings();
    } catch (err) {
      setFormError(err.message || "Unable to publish the internship.");
    } finally {
      setSavingInternship(false);
    }
  }

  async function setListingStatus(listingId, status, confirmMessage) {
    setMainNotice("");
    setMainError("");

    const doUpdate = async () => {
      try {
        const data = await apiRequest(`/api/internships/${listingId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        setMainNotice(data.message || `Listing marked ${status}.`);
        await loadListings();
      } catch (err) {
        setMainError(err.message || "Unable to update the listing.");
      }
      setConfirm(null);
    };

    if (confirmMessage) {
      setConfirm({
        title: confirmMessage.title,
        message: confirmMessage.message,
        onConfirm: doUpdate,
      });
    } else {
      await doUpdate();
    }
  }

  async function handleDelete(listingId) {
    setMainNotice("");
    setMainError("");
    setConfirm({
      title: "Remove this listing?",
      message:
        "The listing and its association with student applications will be removed. This cannot be undone.",
      onConfirm: async () => {
        try {
          const data = await apiRequest(`/api/internships/${listingId}`, {
            method: "DELETE",
          });
          setMainNotice(data.message || "Listing removed.");
          await loadListings();
        } catch (err) {
          setMainError(err.message || "Unable to delete the listing.");
        }
        setConfirm(null);
      },
    });
  }

  async function setApplicationStatus(applicationId, studentName, nextStage) {
    setMainNotice("");
    setMainError("");

    const approvalFlow = nextStage === "rejected";

    setConfirm({
      title: `Move application to ${STAGE_LABELS[nextStage]}?`,
      message: approvalFlow
        ? `${studentName} will be notified that they were not selected for this opportunity.`
        : `${studentName} will be notified of the update to ${STAGE_LABELS[nextStage]}.`,
      onConfirm: async () => {
        try {
          const data = await apiRequest(`/api/applications/${applicationId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status: nextStage }),
          });
          setMainNotice(data.message || "Application status updated.");
          await loadListings();
        } catch (err) {
          setMainError(err.message || "Unable to update application status.");
        }
        setConfirm(null);
      },
    });
  }

  const totalApplicants = applications.length;
  const shortlisted = applications.filter((application) =>
    ["shortlisted", "interview", "selected"].includes(application.status)
  ).length;
  const openListings = internships.filter((listing) => listing.status === "open").length;

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return internships.filter((listing) => {
      const matchesSearch =
        !query ||
        listing.title.toLowerCase().includes(query) ||
        (listing.location || "").toLowerCase().includes(query) ||
        (listing.description || "").toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || listing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [internships, search, statusFilter]);

  if (!user) {
    return (
      <main className="company-page">
        <section className="company-welcome">
          <div>
            <span className="eyebrow">COMPANY PORTAL</span>
            <h1>Session required</h1>
            <p>Please sign in again to access your company dashboard.</p>
            <Link to="/login">Go to sign in</Link>
          </div>
        </section>
      </main>
    );
  }

  if (profileLoading) {
    return (
      <main className="company-page">
        <section className="company-welcome">
          <div>
            <span className="eyebrow">COMPANY PORTAL</span>
            <h1>Loading your workspace…</h1>
          </div>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <>
        <main className="company-page">
          <section className="company-welcome">
            <div>
              <span className="eyebrow">COMPANY PORTAL</span>
              <h1>Create your company profile</h1>
              <p>
                Submit your company details for verification. Once approved,
                you can publish internships and review applicants.
              </p>
            </div>
            <div className="company-mark" aria-hidden="true">
              <Building2 size={32} />
            </div>
          </section>

          {profileError && (
            <div className="internship-notice error" role="alert">{profileError}</div>
          )}

          <section className="company-list-panel">
            <form className="company-job-form" onSubmit={handleCreateProfile}>
              <h3>Company details</h3>

              <label htmlFor="profileName">Company name *</label>
              <input
                id="profileName"
                name="company_name"
                value={profileForm.company_name}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, company_name: event.target.value })
                }
                placeholder="e.g. Akshitha Edutech Pvt Ltd"
                maxLength={200}
                required
              />

              <label htmlFor="profileWebsite">Website (optional)</label>
              <input
                id="profileWebsite"
                name="website"
                value={profileForm.website}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, website: event.target.value })
                }
                placeholder="https://yourcompany.com"
                maxLength={255}
              />

              <label htmlFor="profileDescription">About the company (optional)</label>
              <textarea
                id="profileDescription"
                name="description"
                rows={4}
                value={profileForm.description}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, description: event.target.value })
                }
                placeholder="Describe your organization, industry and work."
                maxLength={2000}
              />

              {profileError && (
                <div className="internship-notice error" role="alert">{profileError}</div>
              )}

              <button
                type="submit"
                className="company-primary-button"
                disabled={profileSaving}
              >
                {profileSaving ? "Submitting…" : "Submit for verification"}
              </button>
            </form>
          </section>
        </main>
      {confirm && (
          <ConfirmModal
            isOpen
            confirmText="Confirm"
            title={confirm.title}
            message={confirm.message}
            danger
            onCancel={() => setConfirm(null)}
            onConfirm={confirm.onConfirm}
          />
        )}
      </>
    );
  }

  return (
    <>
      <main className="company-page">

        <section className="company-welcome">
          <div>
            <span className="eyebrow">COMPANY PORTAL</span>
            <h1>Company Dashboard</h1>
            <p>{profile.company_name}</p>
          </div>

          <div className="company-mark" aria-hidden="true">
            <Building2 size={32} />
          </div>
        </section>

        <div style={{ marginBottom: "12px" }}>
          <button
            type="button"
            className="company-primary-button"
            onClick={() => (editProfileOpen ? setEditProfileOpen(false) : openEditProfile())}
          >
            {editProfileOpen ? "Close Profile Editor" : "Edit Company Profile"}
          </button>
        </div>

        {editProfileOpen && editForm && (
          <section className="company-list-panel">
            <form className="company-job-form" onSubmit={handleEditProfile}>
              <h3>Company details</h3>

              <label htmlFor="editCompanyName">Company name *</label>
              <input
                id="editCompanyName"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                maxLength={200}
                required
              />

              <label htmlFor="editWebsite">Website</label>
              <input
                id="editWebsite"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://yourcompany.com"
                maxLength={255}
              />

              <label htmlFor="editDescription">About the company</label>
              <textarea
                id="editDescription"
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                maxLength={2000}
              />

              <button type="submit" className="company-primary-button" disabled={editSaving}>
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </section>
        )}

        <section
          className={`internship-notice ${isVerified ? "" : "error"}`}
          role={isVerified ? "status" : "alert"}
        >
          {isVerified ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>
            {isVerified
              ? "Your company is verified. You can publish internships and manage applicants."
              : profile.verification_status === "pending"
                ? "Your company profile is pending verification. Publishing opportunities is disabled until the administration approves your account."
                : profile.verification_status === "rejected"
                  ? `Your verification was rejected${profile.reviewer_note ? `: ${profile.reviewer_note}` : ". Please contact support to clarify before reapplying."}`
                  : "Company verification status unknown. Contact support."}
          </span>
        </section>

        <section className="company-stats" aria-label="Company statistics">
          <article className="company-stat">
            <BriefcaseBusiness />
            <div><strong>{internships.length}</strong><span>My Listings</span></div>
          </article>
          <article className="company-stat">
            <Clock />
            <div><strong>{openListings}</strong><span>Open for applications</span></div>
          </article>
          <article className="company-stat">
            <Users />
            <div><strong>{totalApplicants}</strong><span>Total Applicants</span></div>
          </article>
          <article className="company-stat">
            <CheckCircle2 />
            <div><strong>{shortlisted}</strong><span>In interviews pipeline</span></div>
          </article>
        </section>

        <section className="company-list-panel">
          <div className="company-list-heading">
            <div>
              <h2>Internship Listings</h2>
            </div>
            <button
              type="button"
              className="company-primary-button company-add-button"
              onClick={() => {
                setMainNotice("");
                setMainError("");
                setFormError("");
                if (!isVerified) {
                  setMainError(
                    profile.verification_status === "pending"
                      ? "Publishing is disabled until the administration verifies your company profile."
                      : "Your company must be verified before you can publish internships."
                  );
                  return;
                }
                setShowForm((current) => !current);
              }}
            >
              {showForm ? <X size={17} /> : <Plus size={17} />}
              {showForm ? "Cancel" : "Add Internship"}
            </button>
          </div>

          {mainNotice && <div className="internship-notice" role="status">{mainNotice}</div>}
          {mainError && <div className="internship-notice error" role="alert">{mainError}</div>}

          {isLoading && <div className="dashboard-empty" role="status"><RefreshCw size={22} /> <h3>Loading listings…</h3></div>}

          {loadError && !isLoading && (
            <div className="internship-notice error" role="alert">
              {loadError}
              <button type="button" onClick={loadListings} className="company-primary-button">
                Retry
              </button>
            </div>
          )}

          {showForm && isVerified && (
            <form className="company-job-form" onSubmit={handlePublish} noValidate>
              <h3>Publish a New Opportunity</h3>

              <label htmlFor="jobKind">Opportunity type</label>
              <select id="jobKind" name="kind" value={form.kind} onChange={handleChange}>
                <option value="internship">Internship</option>
                <option value="job">Job opening</option>
              </select>

              <label htmlFor="jobTitle">Title *</label>
              <input id="jobTitle" name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. React Developer Intern" maxLength={200} required />

              <label htmlFor="jobDomain">Domain</label>
              <select id="jobDomain" name="domain" value={form.domain} onChange={handleChange}>
                <option>IT</option>
                <option>Non-IT</option>
              </select>

              <label htmlFor="jobType">Work type</label>
              <select id="jobType" name="workType" value={form.workType} onChange={handleChange}>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
              </select>

              <label htmlFor="jobLocation">Location</label>
              <input id="jobLocation" name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Hyderabad or Remote" maxLength={150} />

              <label htmlFor="jobDuration">Duration</label>
              <select id="jobDuration" name="duration" value={form.duration} onChange={handleChange}>
                <option>1 month</option>
                <option>3 months</option>
                <option>6 months</option>
                <option>12 months</option>
              </select>

              <label htmlFor="jobStipend">Stipend (INR per month, optional)</label>
              <input id="jobStipend" name="stipend" value={form.stipend} onChange={handleChange}
                placeholder="e.g. 10000" inputMode="numeric" maxLength={10} />

              <label htmlFor="jobDeadline">Application deadline (optional)</label>
              <input id="jobDeadline" type="date" name="applicationDeadline"
                value={form.applicationDeadline} onChange={handleChange}
                min={new Date().toISOString().slice(0, 10)} />

              <label htmlFor="jobSkills">Skills (comma separated)</label>
              <input id="jobSkills" name="skills" value={form.skills} onChange={handleChange}
                placeholder="e.g. React, JavaScript, Git" maxLength={500} />

              <label htmlFor="jobEligibility">Eligibility (optional)</label>
              <input id="jobEligibility" name="eligibility" value={form.eligibility} onChange={handleChange}
                placeholder="e.g. Final-year students, basic JavaScript" maxLength={300} />

              <label htmlFor="jobDescription">Description *</label>
              <textarea id="jobDescription" name="description" rows={4}
                value={form.description} onChange={handleChange}
                placeholder="Describe responsibilities and required skills." maxLength={2000} required />

              {formError && (
                <div className="internship-notice error" role="alert">{formError}</div>
              )}

              <button className="company-primary-button" type="submit" disabled={savingInternship}>
                {savingInternship ? "Publishing…" : "Publish Internship"}
              </button>
            </form>
          )}

          {!isLoading && !loadError && (
            <>
              <div className="company-search-row">
                <Search size={19} />

                <input
                  type="text"
                  placeholder="Search your internships…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search your internships"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter listings by status"
                >
                  <option value="All">All statuses</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="company-job-list">
                {visibleListings.length === 0 ? (
                  <div className="dashboard-empty">
                    <BriefcaseBusiness size={28} />
                    <h3>{internships.length === 0 ? "No internships yet" : "No matching listings"}</h3>
                    <p>{internships.length === 0
                      ? isVerified
                        ? "Create your first internship listing to get started."
                        : "Your company must be verified before you can publish listings."
                      : "Try another search or status filter."}</p>
                  </div>
                ) : (
                  visibleListings.map((listing) => (
                    <article className="company-job-card" key={listing.id}>
                      <div className="company-job-icon"><BriefcaseBusiness size={23} /></div>
                      <div className="company-job-info">
                        <div className="internship-tags">
                          <span className={listing.status === "open" ? "chip-open" : "chip-closed"}>
                            {listing.status || "open"}
                          </span>
                          <span>{listing.domain || "IT"}</span>
                          <span>{listing.work_type || "Not specified"}</span>
                        </div>
                        <h3>{listing.title}</h3>
                        <p><MapPin size={15} /> {listing.location || "Location not specified"}</p>
                        <p><Clock size={15} /> {listing.duration || "Duration not specified"}</p>
                        <p><Users size={15} /> {
                          applications.filter(
                            (application) => application.internship_id === listing.id
                          ).length
                        } applicants</p>
                        {listing.description && <p>{listing.description}</p>}
                        {listing.skills && (
                          <p><strong>Skills:</strong> {String(listing.skills)}</p>
                        )}
                        {Number(listing.stipend) > 0 && (
                          <p><strong>Stipend:</strong> ₹{Number(listing.stipend).toLocaleString("en-IN")}</p>
                        )}
                        {listing.application_deadline && (
                          <p><strong>Deadline:</strong> {formatDate(listing.application_deadline)}</p>
                        )}
                      </div>
                      <div className="company-job-actions">
                        <span className={`company-job-status ${listing.status === "open" ? "is-open" : "is-closed"}`}>
                          {listing.status || "open"}
                        </span>
                        {listing.status !== "open" ? (
                          <button
                            type="button"
                            className="company-ghost-button"
                            onClick={() => setListingStatus(listing.id, "open")}
                          >
                            Reopen
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="company-ghost-button"
                            onClick={() =>
                              setListingStatus(listing.id, "closed", {
                                title: "Close this listing?",
                                message:
                                  "New applications will be rejected while this listing is closed. Applicants already in the pipeline are unaffected.",
                              })
                            }
                          >
                            Close
                          </button>
                        )}
                        <button
                          type="button"
                          className="company-danger-button"
                          onClick={() => handleDelete(listing.id)}
                          aria-label={`Delete ${listing.title}`}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <section className="company-list-panel">
          <div className="company-list-heading">
            <div>
              <h2>Student Applicants</h2>
            </div>
            <Users size={24} />
          </div>

          {!isLoading && (applications.length === 0 ? (
            <div className="dashboard-empty">
              <Users size={28} />
              <h3>No student applications yet</h3>
              <p>Applications for your published internships will appear here.</p>
            </div>
          ) : (
            <div className="company-job-list">
              {applications.map((application) => (
                <article
                  className="company-job-card"
                  key={application.id}
                >
                  <div className="company-job-icon"><Users size={23} /></div>
                  <div className="company-job-info">
                    <h3>{application.full_name || "Student"}</h3>
                    <p><strong>Email:</strong> {application.email || "Email unavailable"}</p>
                    {application.phone && (
                      <p><strong>Phone:</strong> {application.phone}</p>
                    )}
                    <p><strong>Internship:</strong> {application.title || "Internship"}</p>
                    <p><strong>Applied:</strong> {formatDate(application.applied_at)}</p>
                  </div>
                  <div className="company-job-actions">
                    <span className={`company-job-status ${["applied", "shortlisted", "interview", "selected", "joined", "completed"].includes(application.status) ? "is-open" : "is-closed"}`}>
                      {STAGE_LABELS[application.status] || application.status}
                    </span>
                    {application.internship_id && (
                      <button
                        type="button"
                        className="company-ghost-button company-view-applicant-button"
                        onClick={() => handleViewApplicant(application.id)}
                      >
                        <Eye size={14} /> View Profile
                      </button>
                    )}
                    <label className="company-application-status">
                      <span>Update stage</span>
                      <select
                        value=""
                        disabled={(VALID_TRANSITIONS[application.status] || []).length === 0}
                        onChange={(event) =>
                          setApplicationStatus(
                            application.id,
                            application.full_name || "the student",
                            event.target.value
                          )
                        }
                        aria-label={`Update stage for ${application.full_name || "student"}`}
                      >
                        <option value="">
                          {(VALID_TRANSITIONS[application.status] || []).length === 0
                            ? "No further stages"
                            : "Move to…"}
                        </option>
                        {(VALID_TRANSITIONS[application.status] || []).map((stage) => (
                          <option key={stage} value={stage}>
                            {STAGE_LABELS[stage]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </section>
      </main>

      {viewLoading && (
        <div className="internship-notice" role="status" style={{ marginTop: "12px" }}>
          Loading applicant details…
        </div>
      )}

      {viewError && (
        <div className="internship-notice error" role="alert" style={{ marginTop: "12px" }}>
          {viewError}
        </div>
      )}

      {viewApplicant && (
        <div
          role="dialog"
          aria-modal="true"
          className="internship-details-modal-overlay"
          onClick={() => setViewApplicant(null)}
        >
          <div
            className="internship-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="internship-details-modal-head">
              <div>
                <span className="internship-details-modal-eyebrow">
                  APPLICANT PROFILE
                </span>
                <h3>{viewApplicant.full_name}</h3>
              </div>
              <button
                type="button"
                className="internship-details-modal-close"
                onClick={() => setViewApplicant(null)}
                aria-label="Close applicant details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="internship-details-modal-grid">
              <div>
                <span>Email</span>
                <p>{viewApplicant.email || "Not provided"}</p>
              </div>
              <div>
                <span>Phone</span>
                <p>{viewApplicant.phone || "Not provided"}</p>
              </div>
              <div>
                <span>Applied for</span>
                <p>{viewApplicant.title || "Internship"}</p>
              </div>
              <div>
                <span>Current stage</span>
                <p>{STAGE_LABELS[viewApplicant.status] || viewApplicant.status}</p>
              </div>
              <div>
                <span>Education</span>
                <p>{viewApplicant.education || "Not provided"}</p>
              </div>
              <div>
                <span>College</span>
                <p>{viewApplicant.college || "Not provided"}</p>
              </div>
              <div>
                <span>Course / Branch</span>
                <p>
                  {viewApplicant.course || "Not provided"}
                  {viewApplicant.branch ? ` - ${viewApplicant.branch}` : ""}
                </p>
              </div>
              <div>
                <span>Interested domain</span>
                <p>{viewApplicant.domain || "Not selected"}</p>
              </div>
              <div>
                <span>Graduation year</span>
                <p>{viewApplicant.graduation_year || "Not provided"}</p>
              </div>
              <div>
                <span>CGPA</span>
                <p>
                  {viewApplicant.cgpa !== null && viewApplicant.cgpa !== undefined
                    ? viewApplicant.cgpa : "Not provided"}
                </p>
              </div>
              <div className="internship-details-modal-full">
                <span>Skills</span>
                <p>{viewApplicant.skills || "Not provided"}</p>
              </div>
            </div>

            {viewError && (
              <p className="company-resume-error" role="alert">
                <AlertCircle size={15} /> {viewError}
              </p>
            )}

            <div className="internship-details-modal-footer">
              <button
                type="button"
                className="company-primary-button"
                onClick={() => handleDownloadResume(viewApplicant.student_id)}
              >
                <Download size={16} /> Download Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          isOpen
          confirmText="Confirm"
          title={confirm.title}
          message={confirm.message}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      )}
    </>
  );
}
