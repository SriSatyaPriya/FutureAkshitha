
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BriefcaseBusiness,
  MapPin,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  RefreshCw,
  IndianRupee,
} from "lucide-react";

import { apiRequest, getStoredToken } from "../services/api";
import { getCurrentUser } from "../services/demoStore";

const DURATIONS = ["All", "1 month", "3 months", "6 months", "12 months"];

function matchesDuration(value, internshipDuration) {
  if (!internshipDuration) return false;
  const text = String(internshipDuration).toLowerCase();
  if (value === "3 months") {
    return text.includes("3 month") || text.includes("3-6") || text.includes("3–6");
  }
  if (value === "6 months") {
    return text.includes("6 month") && !text.includes("3-6") && !text.includes("3–6");
  }
  return text.includes(value.replace(" months", " month"));
}

function formatStipend(stipend) {
  const amount = Number(stipend || 0);
  if (!amount) return "Paid / negotiate at offer";
  return `₹${amount.toLocaleString("en-IN")}${typeof stipend === "string" ? "" : " / month"}`;
}

export default function Internships() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [workType, setWorkType] = useState("All");
  const [duration, setDuration] = useState("All");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);

  const currentUser = getCurrentUser();
  const isStudent = currentUser?.role?.toLowerCase() === "student";
  const hasSession = Boolean(getStoredToken());

  async function loadInternships() {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/internships?kind=internship");
      setInternships(data.internships || []);
    } catch (err) {
      setLoadError(err.message || "Unable to load internships.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadApplications() {
    if (!isStudent || !hasSession) return;
    try {
      const data = await apiRequest("/api/applications/my");
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    }
  }

  useEffect(() => {
    loadInternships();
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedIds = useMemo(
    () =>
      new Set(
        applications.map((item) => String(item.internship_id))
      ),
    [applications]
  );

  const filteredInternships = useMemo(() => {
    const query = search.trim().toLowerCase();

    return internships.filter((item) => {
      const skills = String(item.skills || "").toLowerCase();

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.company_name || "").toLowerCase().includes(query) ||
        skills.includes(query) ||
        (item.description || "").toLowerCase().includes(query);

      const matchesDomain = domain === "All" || item.domain === domain;
      const matchesType =
        workType === "All" || item.work_type === workType;
      const matchesDurationFilter =
        duration === "All" || matchesDuration(duration, item.duration);

      return matchesSearch && matchesDomain && matchesType && matchesDurationFilter;
    });
  }, [internships, search, domain, workType, duration]);

  function hasApplied(internshipId) {
    return appliedIds.has(String(internshipId));
  }

  async function apply(item) {
    if (!currentUser || !hasSession) {
      navigate("/login");
      return;
    }

    if (!isStudent) {
      setNoticeType("error");
      setNotice("Only student accounts can apply for internships.");
      setSelected(null);
      return;
    }

    try {
      const data = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          internship_id: Number(item.id),
          kind: "internship",
        }),
      });

      setNoticeType("success");
      setNotice(data.message || `Applied for ${item.title}.`);
      await loadApplications();
      setSelected(null);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      setNoticeType("error");
      setNotice(err.message || "Unable to submit application.");
    }
  }

  return (
    <main className="internship-page">
      <section className="internship-hero">
        <span className="eyebrow">YOUR NEXT OPPORTUNITY</span>

        <h1>
          Find an Internship That{" "}
          <span>Moves You Forward</span>
        </h1>

        <p>
          Explore opportunities, discover new skills, and gain practical
          experience.
        </p>

        <div className="internship-search">
          <Search size={20} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by role, company, or skill..."
            aria-label="Search internships"
          />
        </div>
      </section>

      <section className="internship-results">
        <div className="internship-filters">
          <div className="filter-heading">
            <SlidersHorizontal size={18} />
            <strong>Filters</strong>
          </div>

          <label htmlFor="domainFilter">Domain</label>

          <select
            id="domainFilter"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          >
            <option>All</option>
            <option>IT</option>
            <option>Non-IT</option>
          </select>

          <label htmlFor="workFilter">Work type</label>

          <select
            id="workFilter"
            value={workType}
            onChange={(event) => setWorkType(event.target.value)}
          >
            <option>All</option>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>On-site</option>
          </select>

          <label htmlFor="durationFilter">Duration</label>

          <select
            id="durationFilter"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          >
            {DURATIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <button
            type="button"
            className="filter-reset"
            onClick={() => {
              setSearch("");
              setDomain("All");
              setWorkType("All");
              setDuration("All");
              setNotice("");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="internship-list-area">
          <div className="internship-list-heading">
            <div>
              <h2>Available Internships</h2>
              <p>
                {filteredInternships.length} opportunities found
              </p>
            </div>

          </div>

          {notice && (
            <div
              className={`internship-notice ${noticeType}`}
              role="status"
              aria-live="polite"
            >
              {noticeType === "success" && (
                <CheckCircle2 size={18} />
              )}

              <span>{notice}</span>

              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {isLoading && (
            <div className="internship-empty" role="status">
              <RefreshCw size={28} />
              <h3>Loading internships…</h3>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="internship-empty" role="alert">
              <Search size={30} />
              <h3>Unable to load internships</h3>
              <p>{loadError}</p>
              <button type="button" className="internship-details-button" onClick={loadInternships}>
                Try again
              </button>
            </div>
          )}

          {!isLoading && !loadError && filteredInternships.length === 0 && (
            <div className="internship-empty">
              <Search size={32} />
              <h3>No internships found</h3>
              <p>
                Try a different search term or clear your filters. New
                opportunities from verified companies appear here as they are
                published.
              </p>
            </div>
          )}

          {!isLoading && !loadError && filteredInternships.length > 0 && (
            <div className="internship-list">
              {filteredInternships.map((item) => {
                const applied = hasApplied(item.id);
                const deadlinePassed =
                  item.application_deadline &&
                  new Date(item.application_deadline) < new Date();

                return (
                  <article
                    className="internship-list-card"
                    key={item.id}
                  >
                    <div className="internship-list-icon">
                      <BriefcaseBusiness size={25} />
                    </div>

                    <div className="internship-list-content">
                      <div className="internship-tags">
                        <span>{item.domain || "IT"}</span>
                        <span>{item.work_type || "Not specified"}</span>
                        {deadlinePassed && <span>Closed</span>}
                      </div>

                      <h3>{item.title}</h3>

                      <p className="internship-company">
                        <Building2 size={15} />
                        {item.company_name || "Verified company"}
                      </p>

                      <p className="internship-description">
                        {item.description}
                      </p>

                      {item.skills && (
                        <div className="internship-skills">
                          {String(item.skills)
                            .split(",")
                            .map((skill) => skill.trim())
                            .filter(Boolean)
                            .map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                        </div>
                      )}

                      <div className="internship-card-meta">
                        <span>
                          <MapPin size={15} />
                          {item.location || "Not specified"}
                        </span>

                        <span>
                          <Clock size={15} />
                          {item.duration || "Not specified"}
                        </span>

                        <span>
                          <IndianRupee size={15} />
                          {formatStipend(item.stipend)}
                        </span>
                      </div>
                    </div>

                    <div className="internship-list-actions">
                      <button
                        type="button"
                        className="internship-details-button"
                        onClick={() => setSelected(item)}
                      >
                        Details
                      </button>

                      <button
                        type="button"
                        className="internship-apply-button"
                        onClick={() => {
                          if (!currentUser || !hasSession) {
                            setNoticeType("error");
                            setNotice("Please log in as a student to apply.");
                            setSelected(item);
                            return;
                          }
                          if (!isStudent) {
                            setNoticeType("error");
                            setNotice("Only student accounts can apply.");
                            return;
                          }
                          apply(item);
                        }}
                        disabled={applied || deadlinePassed}
                        aria-label={
                          applied
                            ? `Already applied for ${item.title}`
                            : `Apply for ${item.title}`
                        }
                      >
                        {applied
                          ? "Applied"
                          : deadlinePassed
                            ? "Closed"
                            : "Apply"}

                        {applied ? (
                          <CheckCircle2 size={15} />
                        ) : deadlinePassed ? null : (
                          <ArrowRight size={15} />
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="internship-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="internship-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <span className="eyebrow">
              VERIFIED COMPANY OPPORTUNITY
            </span>

            <h2 id="internship-modal-title">
              {selected.title}
            </h2>

            <p className="internship-company">
              <Building2 size={15} />
              {selected.company_name}
            </p>
            <p>{selected.description}</p>
            <p><strong>Domain:</strong> {selected.domain || "IT"}</p>
            <p><strong>Work type:</strong> {selected.work_type || "Not specified"}</p>
            <p><strong>Location:</strong> {selected.location || "Not specified"}</p>
            <p><strong>Duration:</strong> {selected.duration || "Not specified"}</p>
            <p><strong>Stipend:</strong> {formatStipend(selected.stipend)}</p>
            {selected.application_deadline && (
              <p><strong>Apply before:</strong> {new Date(selected.application_deadline).toLocaleDateString("en-IN")}</p>
            )}
            <p>
              <strong>Skills:</strong>{" "}
              {selected.skills
                ? String(selected.skills)
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .join(", ")
                : "Not specified"}
            </p>
            <p>
              <strong>Eligibility:</strong>{" "}
              {selected.eligibility ||
                "Confirm eligibility and selection requirements with the listed company."}
            </p>

            <button
              type="button"
              className="internship-apply-button"
              onClick={() => apply(selected)}
              disabled={hasApplied(selected.id)}
            >
              {hasApplied(selected.id)
                ? "Already Applied"
                : "Apply for internship"}

              {hasApplied(selected.id) ? (
                <CheckCircle2 size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          </section>
        </div>
      )}

      <div className="internship-bottom-link">
        {isStudent ? (
          <Link to="/student-dashboard">
            Back to Student Dashboard
          </Link>
        ) : (
          <Link to="/">Back to Home</Link>
        )}
      </div>
    </main>
  );
}
