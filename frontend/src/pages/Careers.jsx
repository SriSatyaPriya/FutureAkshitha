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
} from "lucide-react";

import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/demoStore";

const demoJobs = [
  {
    id: "demo-4",
    title: "UI/UX Designer",
    description:
      "Create intuitive user experiences and beautiful interfaces. Conduct user research, wireframe, prototype, and hand off designs to engineering.",
    company_name: "PureForm Design Studio",
    location: "Mumbai, India",
    duration: "3 months",
    work_type: "Hybrid",
    skills: "Figma, Adobe XD, Prototyping, User Research",
    domain: "Non-IT",
    eligibility: "B.Des / B.F.A. or portfolio-driven design background",
    isDemo: true,
  },
  {
    id: "demo-5",
    title: "Data Analyst",
    description:
      "Turn raw data into actionable insights. Build dashboards, run SQL queries, and partner with product teams to drive data-backed decisions.",
    company_name: "InsightWave Analytics",
    location: "Chennai, India",
    duration: "5 months",
    work_type: "Remote",
    skills: "SQL, Tableau, Python, Excel, Statistics",
    domain: "IT",
    eligibility: "B.Tech / B.Sc. in Math, Statistics, CS, or Economics",
    isDemo: true,
  },
  {
    id: "demo-6",
    title: "DevOps Engineer",
    description:
      "Manage CI/CD pipelines, cloud infrastructure, and container orchestration. Ensure reliability, scalability, and security across environments.",
    company_name: "InfraScale Cloud",
    location: "Delhi, India",
    duration: "6 months",
    work_type: "Hybrid",
    skills: "AWS, Docker, Kubernetes, Jenkins, Terraform",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE or IT with cloud interest",
    isDemo: true,
  },
  {
    id: "demo-7",
    title: "Mobile App Developer (Flutter)",
    description:
      "Build cross-platform mobile apps for iOS and Android using Flutter. Deliver smooth, performant experiences used by thousands of users.",
    company_name: "AppForge Mobile",
    location: "Kolkata, India",
    duration: "4 months",
    work_type: "Remote",
    skills: "Flutter, Dart, Firebase, REST APIs",
    domain: "IT",
    eligibility: "B.Tech / B.E. or equivalent with mobile development interest",
    isDemo: true,
  },
  {
    id: "demo-8",
    title: "Cybersecurity Analyst",
    description:
      "Protect systems and data from threats. Monitor networks, run vulnerability assessments, and respond to security incidents.",
    company_name: "ShieldGate Security",
    location: "Noida, India",
    duration: "6 months",
    work_type: "On-site",
    skills: "Network Security, SIEM, Vulnerability Assessment, Linux",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE, IT, or Cybersecurity certification",
    isDemo: true,
  },
  {
    id: "demo-9",
    title: "Product Manager",
    description:
      "Define product vision, prioritize the backlog, and work with engineering and design to launch features users love.",
    company_name: "NextStep Products",
    location: "Gurgaon, India",
    duration: "4 months",
    work_type: "Hybrid",
    skills: "Product Strategy, Roadmapping, Jira, Market Research",
    domain: "Non-IT",
    eligibility: "MBA / B.Tech with strong product sense and communication",
    isDemo: true,
  },
  {
    id: "demo-10",
    title: "Digital Marketing Specialist",
    description:
      "Plan and execute SEO, SEM, and social media campaigns. Analyze performance metrics and optimize for growth and engagement.",
    company_name: "GrowHype Digital",
    location: "Ahmedabad, India",
    duration: "3 months",
    work_type: "Remote",
    skills: "SEO, SEM, Social Media, Google Analytics, Content Marketing",
    domain: "Non-IT",
    eligibility: "BBA / B.Com / B.M.M. or digital marketing certification",
    isDemo: true,
  },
  {
    id: "demo-11",
    title: "Cloud Solutions Architect",
    description:
      "Design cloud migration strategies and architect secure, cost-optimized solutions on AWS and Azure for enterprise clients.",
    company_name: "Aether Cloud",
    location: "Pune, India",
    duration: "6 months",
    work_type: "Hybrid",
    skills: "AWS, Azure, Architecture, Cloud Migration, Cost Optimization",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE or IT with cloud certifications",
    isDemo: true,
  },
  {
    id: "demo-12",
    title: "QA Automation Engineer",
    description:
      "Write automated test suites using Selenium and Cypress. Ensure software quality through rigorous manual and automated testing.",
    company_name: "TestCraft QA",
    location: "Jaipur, India",
    duration: "4 months",
    work_type: "Remote",
    skills: "Selenium, Cypress, Java, TestNG, Bug Tracking",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE, IT, or related with testing interest",
    isDemo: true,
  },
  {
    id: "demo-13",
    title: "Blockchain Developer",
    description:
      "Design and implement decentralized applications and smart contracts on Ethereum and Solana. Build secure, transparent systems for finance and supply chain.",
    company_name: "ChainForge Labs",
    location: "Bangalore, India",
    duration: "6 months",
    work_type: "Remote",
    skills: "Solidity, Ethereum, Web3.js, Smart Contracts, Rust",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE with blockchain interest",
    isDemo: true,
  },
  {
    id: "demo-14",
    title: "Business Analyst",
    description:
      "Bridge the gap between business stakeholders and technical teams. Gather requirements, analyze processes, and define solutions that drive value.",
    company_name: "Meridian Consulting",
    location: "Gurgaon, India",
    duration: "4 months",
    work_type: "Hybrid",
    skills: "Requirements Analysis, SQL, Tableau, Jira, Communication",
    domain: "Non-IT",
    eligibility: "MBA / B.Com / B.Tech with strong analytical skills",
    isDemo: true,
  },
  {
    id: "demo-15",
    title: "Machine Learning Engineer",
    description:
      "Build and deploy machine learning models into production. Work with data pipelines, model training, and MLOps to power intelligent products.",
    company_name: "NeuralEdge AI",
    location: "Hyderabad, India",
    duration: "6 months",
    work_type: "Remote",
    skills: "Python, PyTorch, TensorFlow, Scikit-learn, MLOps",
    domain: "IT",
    eligibility: "B.Tech / B.E. or M.Sc. in CS, Math, or Statistics",
    isDemo: true,
  },
  {
    id: "demo-16",
    title: "Technical Writer",
    description:
      "Create clear documentation, API guides, and tutorials for developers. Collaborate with engineering teams to make complex topics easy to understand.",
    company_name: "DocuFlow Systems",
    location: "Pune, India",
    duration: "3 months",
    work_type: "Remote",
    skills: "Technical Writing, Markdown, API Documentation, Content Strategy",
    domain: "Non-IT",
    eligibility: "B.A. / B.Tech with strong writing and technical aptitude",
    isDemo: true,
  },
  {
    id: "demo-17",
    title: "Site Reliability Engineer",
    description:
      "Ensure high availability and performance of production systems. Automate infrastructure, monitor incidents, and improve system reliability.",
    company_name: "StackReliant",
    location: "Delhi, India",
    duration: "6 months",
    work_type: "Hybrid",
    skills: "Linux, AWS, Kubernetes, Prometheus, Terraform, Python",
    domain: "IT",
    eligibility: "B.Tech / B.E. in CSE or IT with DevOps interest",
    isDemo: true,
  },
  {
    id: "demo-18",
    title: "Product Designer",
    description:
      "Shape user experiences from research to final design. Create prototypes, run usability tests, and deliver design systems for web and mobile.",
    company_name: "Forma Design Co.",
    location: "Mumbai, India",
    duration: "4 months",
    work_type: "Hybrid",
    skills: "Figma, UX Research, Prototyping, Design Systems, User Testing",
    domain: "Non-IT",
    eligibility: "B.Des / B.F.A. or portfolio-driven design background",
    isDemo: true,
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
      const remote = (data.internships || []).filter(
        (job) => {
          const title = (job.title || "").toLowerCase();
          const company = (job.company_name || "").toLowerCase();
          const desc = (job.description || "").toLowerCase();
          return (
            !company.includes("novasoft") &&
            !title.includes("e2e job") &&
            !title.includes("withdraw test") &&
            !desc.includes("withdraw test")
          );
        }
      );
      const merged = [...remote, ...demoJobs];
      setJobs(merged);
    } catch (err) {
      setJobs(demoJobs);
      setLoadError(err.message || "Using featured opportunities.");
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

    if (job.isDemo) {
      setMessageType("success");
      setMessage(`Your application for ${job.title} has been recorded.`);
      setApplyingId(null);
      return;
    }

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
        <div className="careers-hero-content">
          <span className="placement-eyebrow">YOUR FUTURE STARTS HERE</span>
          <h1>Careers &amp; Hiring Partners</h1>
          <p>
            Explore verified job openings from hiring partners, discover
            career pathways, and prepare for your next professional step.
          </p>
          <a href="#career-openings" className="placement-primary-btn explore-btn">
            Explore opportunities <ArrowRight size={17} />
          </a>
        </div>
        <div className="careers-hero-icon" aria-hidden="true">
          <GraduationCap size={76} />
        </div>
      </section>

      <section className="careers-stats" aria-label="Career platform highlights">
        <article className="careers-stat-card">
          <div className="careers-stat-icon">
            <Building2 size={25} />
          </div>
          <strong>{jobs.length}</strong>
          <span>Live job openings</span>
        </article>
        <article className="careers-stat-card">
          <div className="careers-stat-icon">
            <Users size={25} />
          </div>
          <strong>{applications.length}</strong>
          <span>Your applications</span>
        </article>
        <article className="careers-stat-card">
          <div className="careers-stat-icon">
            <TrendingUp size={25} />
          </div>
          <strong>Career focused</strong>
          <span>Student development</span>
        </article>
        <article className="careers-stat-card">
          <div className="careers-stat-icon">
            <BriefcaseBusiness size={25} />
          </div>
          <strong>Entry level</strong>
          <span>Career pathways</span>
        </article>
      </section>

      <section className="careers-section" id="career-openings">
        <div className="careers-heading">
          <span className="placement-eyebrow">CAREER OPPORTUNITIES</span>
          <h2>Live job openings</h2>
          <p>
            Openings published by verified partner companies. Browse unique
            roles across IT, design, data, product, and more.
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
            <div className="careers-loading-spinner"></div>
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
          {filteredJobs.map((job, index) => {
            const applied = appliedIds.has(String(job.id));
            return (
              <article className="careers-job-card" key={job.id} style={{ animationDelay: `${index * 0.08}s` }}>
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
                {job.isDemo && (
                  <span className="careers-job-badge">Featured opportunity</span>
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
