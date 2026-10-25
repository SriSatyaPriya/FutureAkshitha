import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Building2,
  Users,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  GraduationCap,
  CheckCircle2,
  Filter,
  RefreshCw,
} from "lucide-react";

import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/demoStore";

const partners = [
  {
    name: "Technology Partners",
    description: "Technology and software career opportunities.",
    icon: Building2,
  },
  {
    name: "Analytics Partners",
    description: "Data, reporting, and analytics opportunities.",
    icon: TrendingUp,
  },
  {
    name: "Service Partners",
    description: "Customer support and operations opportunities.",
    icon: BriefcaseBusiness,
  },
];

const categories = ["All", "IT", "Non-IT"];

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN");
}

export default function Careers() {
  const user = getCurrentUser();
  const isStudent = user?.role?.toLowerCase() === "student";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [applyingId, setApplyingId] = useState(null);
  const [applications, setApplications] = useState([]);

  async function loadJobs() {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/internships?kind=job");
      setJobs(data.internships || []);
    } catch (err) {
      setLoadError(err.message || "Unable to load job openings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadApplications() {
    if (!isStudent) return;
    try {
      const data = await apiRequest("/api/applications/my");
      setApplications(
        (data.applications || []).filter((item) => item.kind === "job")
      );
    } catch {
      setApplications([]);
    }
  }

  useEffect(() => {
    loadJobs();
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack =
        `${job.title} ${job.description || ""} ${job.skills || ""} ${job.company_name || ""} ${job.domain || ""}`.toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (category === "All" || job.domain === category)
      );
    });
  }, [jobs, search, category]);

  const appliedIds = useMemo(
    () => new Set(applications.map((item) => String(item.internship_id))),
    [applications]
  );

  async function applyForJob(job) {
    if (!isStudent) {
      setMessageType("error");
      setMessage(
        user
          ? "Job applications are available to student accounts only."
          : "Please log in with a student account to apply."
      );
      return;
    }

    if (appliedIds.has(String(job.id))) return;

    setApplyingId(job.id);
    setMessageType("info");
    setMessage("");

    try {
      const data = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({ internship_id: job.id, kind: "job" }),
      });
      setMessageType("success");
      setMessage(data.message || `Your application for ${job.title} has been recorded.`);
      await loadApplications();
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Unable to apply for this role.");
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <main className="careers-page">
      <section className="careers-hero">
        <div>
          <span className="placement-eyebrow">YOUR FUTURE STARTS HERE</span>
          <h1>Careers &amp; Hiring Partners</h1>
          <p>
            Explore verified job openings from hiring partners, discover
            career pathways, and prepare for your next professional step.
          </p>
          <a href="#career-openings" className="placement-primary-btn">
            Explore opportunities <ArrowRight size={17} />
          </a>
        </div>
        <div className="careers-hero-icon" aria-hidden="true">
          <GraduationCap size={76} />
        </div>
      </section>

      <section className="careers-stats" aria-label="Career platform highlights">
        <article>
          <Building2 size={25} />
          <strong>{jobs.length}</strong>
          <span>Live job openings</span>
        </article>
        <article>
          <Users size={25} />
          <strong>{applications.length}</strong>
          <span>Your applications</span>
        </article>
        <article>
          <TrendingUp size={25} />
          <strong>Career focused</strong>
          <span>Student development</span>
        </article>
        <article>
          <BriefcaseBusiness size={25} />
          <strong>Entry level</strong>
          <span>Career pathways</span>
        </article>
      </section>

      <section className="careers-section">
        <div className="careers-heading">
          <span className="placement-eyebrow">OUR ECOSYSTEM</span>
          <h2>Hiring partner categories</h2>
          <p>
            Explore the types of employers and industries Future Akshitha aims
            to connect with.
          </p>
        </div>
        <div className="careers-partner-grid">
          {partners.map((partner) => {
            const Icon = partner.icon;
            return (
              <article className="careers-partner-card" key={partner.name}>
                <div className="careers-partner-icon">
                  <Icon size={27} />
                </div>
                <h3>{partner.name}</h3>
                <p>{partner.description}</p>
              </article>
            );
          })}
        </div>
        <p className="careers-disclaimer">
          These are partner categories, not confirmed employer names. Verified
          companies publish live openings below.
        </p>
      </section>

      <section className="careers-section" id="career-openings">
        <div className="careers-heading">
          <span className="placement-eyebrow">CAREER OPPORTUNITIES</span>
          <h2>Live job openings</h2>
          <p>
            Openings published by verified partner companies. Refresh to see
            the latest listings.
          </p>
        </div>

        <div className="careers-filters">
          <label>
            <Search size={18} />
            <input
              type="search"
              placeholder="Search jobs, companies or skills"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search jobs, companies or skills"
            />
          </label>
          <label className="careers-category-filter">
            <Filter size={17} />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by domain"
            >
              {categories.map((item) => (
                <option value={item} key={item}>
                  {item === "All" ? "All domains" : item}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="placement-secondary-btn"
            onClick={loadJobs}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {message && (
          <p
            className={`careers-message careers-message-${messageType}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {isLoading && (
          <div className="careers-empty" role="status">
            <RefreshCw size={30} />
            <h3>Loading openings…</h3>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="careers-empty" role="alert">
            <Building2 size={30} />
            <h3>Unable to load openings</h3>
            <p>{loadError}</p>
            <button type="button" className="placement-secondary-btn" onClick={loadJobs}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !loadError && filteredJobs.length === 0 && (
          <div className="careers-empty">
            <BriefcaseBusiness size={35} />
            <h3>{jobs.length === 0 ? "No live job openings yet" : "No matching roles"}</h3>
            <p>
              {jobs.length === 0
                ? "Verified companies publish opportunities as they become available."
                : "Try another search term or select a different domain."}
            </p>
          </div>
        )}

        <div className="careers-jobs-grid">
          {filteredJobs.map((job) => {
            const applied = appliedIds.has(String(job.id));
            return (
              <article className="careers-job-card" key={job.id}>
                <div className="careers-job-top">
                  <div className="careers-job-icon">
                    <BriefcaseBusiness size={23} />
                  </div>
                  <span>{job.work_type || "Type to confirm"}</span>
                </div>
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <div className="careers-job-meta">
                  <span><Building2 size={15} /> {job.company_name || "Hiring partner"}</span>
                  <span><MapPin size={15} /> {job.location || "Location to be confirmed"}</span>
                  <span><Clock size={15} /> {job.duration || "Duration to be confirmed"}</span>
                </div>
                {job.skills && (
                  <div className="careers-skills">
                    {String(job.skills).split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>
                )}
                {job.eligibility && (
                  <p className="careers-disclaimer"><strong>Eligibility:</strong> {job.eligibility}</p>
                )}
                <button
                  type="button"
                  className="placement-primary-btn"
                  onClick={() => applyForJob(job)}
                  disabled={applied || applyingId === job.id}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 size={17} /> Application submitted
                    </>
                  ) : applyingId === job.id ? (
                    "Submitting…"
                  ) : (
                    <>
                      Apply for this role <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {isStudent && (
          <section className="careers-my-applications" aria-label="My career applications">
            <div className="careers-heading">
              <span className="placement-eyebrow">YOUR ACTIVITY</span>
              <h2>My job applications</h2>
              <p>Track the job openings you have applied for.</p>
            </div>
            {applications.length ? (
              <div className="careers-applications-list">
                {applications.map((application) => (
                  <article key={application.id} className="careers-application-row">
                    <div>
                      <h3>{application.title}</h3>
                      <p>{application.company_name || "Hiring partner"} · {formatDate(application.applied_at)}</p>
                    </div>
                    <span className="careers-application-status">
                      {(() => {
                        const status = (application.status || "applied").toLowerCase();
                        return status.charAt(0).toUpperCase() + status.slice(1);
                      })()}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="careers-empty">
                <BriefcaseBusiness size={28} />
                <h3>No applications yet</h3>
                <p>Job applications you submit will appear here.</p>
              </div>
            )}
          </section>
        )}

        {!isStudent && (
          <div className="careers-unlock-panel">
            <h3>Applying as a student</h3>
            <p>
              Sign in or register as a student to apply for these roles, track
              your application status, and get updates.
            </p>
            <Link to={user ? "/login" : "/register"} className="placement-secondary-btn">
              {user ? "Sign in" : "Create a student account"} <ArrowRight size={17} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
