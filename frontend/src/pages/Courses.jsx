import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Clock3, BookOpen, Code2, Cloud, ShieldCheck, Smartphone,
  BarChart3, BrainCircuit, GitBranch, X, CheckCircle2, ArrowRight,
  GraduationCap, BriefcaseBusiness, Sparkles, Layers3, Award, Filter,
  Globe, FileText, Rocket, Monitor, List, Users as UsersIcon,
} from "lucide-react";
import { getCurrentUser } from "../services/demoStore";
import { apiRequest } from "../services/api";

const SECTIONS = [
  { key: "english", label: "English Courses", annexure: "Annexure A", category: "English Courses", icon: BookOpen, color: "text-blue-600" },
  { key: "hindi", label: "Hindi Courses", annexure: "Annexure B", category: "Hindi Courses", icon: Globe, color: "text-purple-600" },
  { key: "fsa", label: "Future Skill Academy", annexure: "Annexure C", category: "Future Skill Academy", icon: Rocket, color: "text-green-600" },
  { key: "avga", label: "AVGC Courses", annexure: "Annexure C", category: "AVGC Courses", icon: Monitor, color: "text-orange-600" },
  { key: "internships", label: "Internships", annexure: "Annexure D", category: "Internships", icon: BriefcaseBusiness, color: "text-indigo-600" },
  { key: "projects", label: "Student Projects", annexure: "Annexure D", category: "Student Projects", icon: FileText, color: "text-pink-600" },
];

function formatDuration(item) {
  if (item.duration_hours) return `${item.duration_hours} hours`;
  if (item.duration_weeks) return `${item.duration_weeks} weeks`;
  if (item.duration) return item.duration;
  return null;
}

function formatMeta(item) {
  const parts = [];
  if (item.language) parts.push(item.language);
  if (item.vertical) parts.push(item.vertical);
  if (item.delivery_mode) parts.push(item.delivery_mode);
  return parts;
}

export default function Courses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [itemType, setItemType] = useState("");
  const [annexure, setAnnexure] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [vertical, setVertical] = useState("");
  const [credits, setCredits] = useState("");
  const [minHours, setMinHours] = useState("");
  const [maxHours, setMaxHours] = useState("");
  const [minWeeks, setMinWeeks] = useState("");
  const [maxWeeks, setMaxWeeks] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const FILTER_ITEM_TYPES = ["All Types", "Course", "Internship", "Project"];
  const LANGUAGES = ["All Languages", "English", "Hindi"];

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setIsLoading(true);
        setLoadError("");

        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (itemType) params.set("item_type", itemType.toLowerCase());
        if (annexure) params.set("source_annexure", annexure);
        if (category) params.set("source_category", category);
        if (language) params.set("language", language);
        if (vertical) params.set("vertical", vertical);
        if (credits) params.set("credits", credits);
        if (minHours) params.set("min_hours", minHours);
        if (maxHours) params.set("max_hours", maxHours);
        if (minWeeks) params.set("min_weeks", minWeeks);
        if (maxWeeks) params.set("max_weeks", maxWeeks);
        params.set("page", String(page));
        params.set("limit", String(limit));

        const response = await apiRequest(`/api/courses?${params.toString()}`);
        const rows = Array.isArray(response) ? response : (response.courses || []);
        const totalCount = (response && response.pagination && response.pagination.total) || rows.length;

        if (!cancelled) {
          setCourses(rows);
          setTotal(totalCount);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Unable to load catalogue.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    if (user?.role?.toLowerCase() === "student") {
      apiRequest("/api/enrollments/my")
        .then((response) => {
          const rows = Array.isArray(response) ? response : (response.enrollments || []);
          if (!cancelled) {
            setEnrollments(
              rows.map((item) => ({
                id: item.id,
                studentId: item.student_id ?? item.studentId ?? user.id,
                courseId: item.course_id ?? item.courseId,
                courseTitle: item.title ?? item.course_title ?? item.courseTitle ?? "",
                status: item.status,
              }))
            );
          }
        })
        .catch((err) => {
          console.error("Unable to load enrollments:", err);
        });
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [search, itemType, annexure, category, language, vertical, credits, minHours, maxHours, minWeeks, maxWeeks, page]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setSelectedItem(null);
    }
    if (selectedItem) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem]);

  const myEnrollments = useMemo(() => {
    if (!currentUser?.id) return [];
    return enrollments.filter(
      (item) => String(item.studentId) === String(currentUser.id)
    );
  }, [enrollments, currentUser]);

  const isEnrolled = (courseId) =>
    myEnrollments.some((item) => String(item.courseId) === String(courseId));

  const sectionsWithCounts = useMemo(() => {
    return SECTIONS.map((section) => {
      const count = courses.filter((c) => {
        const matchAnnexure = c.source_annexure === section.annexure;
        const matchCategory = c.source_category === section.category;
        return matchAnnexure && matchCategory;
      }).length;
      return { ...section, count };
    });
  }, [courses]);

  const availableVerticals = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => { if (c.vertical) set.add(c.vertical); });
    return Array.from(set).sort();
  }, [courses]);

  const availableCredits = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => { if (c.credits) set.add(c.credits); });
    return Array.from(set).sort((a, b) => a - b);
  }, [courses]);

  async function handleEnroll(item) {
    const user = getCurrentUser();
    if (!user) {
      setNotice("Please log in or register as a student to enroll.");
      navigate("/login");
      return;
    }
    if (String(user.role || "").toLowerCase() !== "student") {
      setNotice("Only student accounts can enroll in courses.");
      return;
    }
    if (!Number.isInteger(Number(item.id))) {
      setNotice("This item has an invalid database ID.");
      return;
    }
    try {
      await apiRequest("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: Number(item.id) }),
      });
      const response = await apiRequest("/api/enrollments/my");
      const rows = Array.isArray(response) ? response : (response.enrollments || []);
      setEnrollments(
        rows.map((item) => ({
          id: item.id,
          studentId: item.student_id ?? item.studentId ?? user.id,
          courseId: item.course_id ?? item.courseId,
          courseTitle: item.title ?? item.course_title ?? item.courseTitle ?? "",
          status: item.status,
        }))
      );
      setNotice(`Enrollment request submitted for ${item.title}!`);
      setSelectedItem(null);
    } catch (err) {
      const errMsg = String(err.message || "");
      if (errMsg.toLowerCase().includes("already enrolled")) {
        setNotice(`You are already enrolled in ${item.title}.`);
      } else if (errMsg.toLowerCase().includes("token") || errMsg.toLowerCase().includes("log in")) {
        setNotice("Your session has expired. Please sign in again.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setNotice(errMsg || "Unable to enroll. Please try again.");
      }
    }
  }

  async function handleBookDemo(item) {
    const user = getCurrentUser();
    if (!user) {
      setNotice("Please log in as a student to book a demo.");
      navigate("/login");
      return;
    }
    if (String(user.role || "").toLowerCase() !== "student") {
      setNotice("Only student accounts can book demo sessions.");
      return;
    }
    try {
      const res = await apiRequest(`/api/courses/${item.id}/demo`, { method: "POST" });
      setNotice(res.message || "Demo request received.");
      setSelectedItem(null);
    } catch (err) {
      setNotice(err.message || "Unable to request a demo. Please try again.");
    }
  }

  function handleOpen(item) {
    setNotice("");
    setSelectedItem(item);
  }

  function handleClearFilters() {
    setSearch("");
    setItemType("");
    setAnnexure("");
    setCategory("");
    setLanguage("");
    setVertical("");
    setCredits("");
    setMinHours("");
    setMaxHours("");
    setMinWeeks("");
    setMaxWeeks("");
    setPage(1);
  }

  return (
    <main className="courses-page">
      <section className="courses-hero">
        <div className="courses-hero-glow" aria-hidden="true" />
        <div className="courses-hero-content">
          <span className="courses-eyebrow">
            <Sparkles size={15} /> LEARN • BUILD • GROW
          </span>
          <h1>
            Explore <span>Our Catalogue</span>
          </h1>
          <p>
            Browse courses, internships, and student projects from our
            official annexure catalogue. All records are admin-controlled
            and published for public discovery.
          </p>
          <div className="courses-hero-stats">
            <div>
              <strong>{total}+</strong>
              <span>Catalogue records</span>
            </div>
            <div>
              <strong>6 Sections</strong>
              <span>English • Hindi • FSA • AVGC • Internships • Projects</span>
            </div>
            <div>
              <strong>Admin Verified</strong>
              <span>Published and quality-checked</span>
            </div>
          </div>
        </div>
      </section>

      <section className="courses-main">
        <div className="courses-section-heading">
          <div>
            <span className="courses-kicker">OFFICIAL CATALOGUE</span>
            <h2>Discover Learning Opportunities</h2>
            <p>
              Search, filter, and explore every published course,
              internship, and project across all annexures.
            </p>
          </div>
          {currentUser?.role?.toLowerCase() === "student" && (
            <div className="courses-enrolled-summary">
              <GraduationCap size={21} />
              <div>
                <strong>{myEnrollments.length}</strong>
                <span>Courses enrolled</span>
              </div>
            </div>
          )}
        </div>

        {notice && (
          <div className="courses-notice" role="status">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Toolbar: Filters */}
        <div className="courses-toolbar">
          <label className="courses-search">
            <Search size={19} />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search title, skills, vertical..."
              aria-label="Search catalogue"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setPage(1); }} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </label>

          <div className="courses-filter-group" aria-label="Filter by item type">
            {FILTER_ITEM_TYPES.map((filter) => (
              <button
                type="button"
                key={filter}
                className={itemType === filter.toLowerCase() || (filter === "All Types" && !itemType) ? "active" : ""}
                onClick={() => {
                  setItemType(filter === "All Types" ? "" : filter.toLowerCase());
                  setPage(1);
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="courses-filter-group" aria-label="Filter by section">
            {SECTIONS.map((section) => {
              const active = annexure === section.annexure && category === section.category;
              const Icon = section.icon;
              return (
                <button
                  type="button"
                  key={section.key}
                  className={active ? "active section-filter" : "section-filter"}
                  onClick={() => {
                    setAnnexure(active ? "" : section.annexure);
                    setCategory(active ? "" : section.category);
                    setPage(1);
                  }}
                >
                  <Icon size={16} />
                  <span>{section.label}</span>
                  {active && <span className="section-count">{section.count}</span>}
                </button>
              );
            })}
          </div>

          <label className="courses-level-select">
            <span className="sr-only">Language</span>
            <select value={language || ""} onChange={(e) => { setLanguage(e.target.value); setPage(1); }}>
              {LANGUAGES.map((item) => (
                <option key={item} value={item === "All Languages" ? "" : item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="courses-level-select">
            <span className="sr-only">Vertical</span>
            <select value={vertical || ""} onChange={(e) => { setVertical(e.target.value); setPage(1); }}>
              <option value="">All Verticals</option>
              {availableVerticals.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </label>

          <label className="courses-level-select">
            <span className="sr-only">Credits</span>
            <select value={credits || ""} onChange={(e) => { setCredits(e.target.value); setPage(1); }}>
              <option value="">All Credits</option>
              {availableCredits.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>

          <button type="button" className="courses-filter-reset" onClick={handleClearFilters}>
            <Filter size={16} /> Reset Filters
          </button>
        </div>

        {/* Duration filters */}
        <div className="courses-duration-filters">
          <label>
            <span>Min Hours</span>
            <input type="number" min="0" value={minHours} onChange={(e) => { setMinHours(e.target.value); setPage(1); }} placeholder="0" />
          </label>
          <label>
            <span>Max Hours</span>
            <input type="number" min="0" value={maxHours} onChange={(e) => { setMaxHours(e.target.value); setPage(1); }} placeholder="0" />
          </label>
          <label>
            <span>Min Weeks</span>
            <input type="number" min="0" value={minWeeks} onChange={(e) => { setMinWeeks(e.target.value); setPage(1); }} placeholder="0" />
          </label>
          <label>
            <span>Max Weeks</span>
            <input type="number" min="0" value={maxWeeks} onChange={(e) => { setMaxWeeks(e.target.value); setPage(1); }} placeholder="0" />
          </label>
        </div>

        <div className="courses-results-line">
          <span>
            Showing <strong>{courses.length}</strong> of <strong>{total}</strong>{" "}
            catalogue records
          </span>
          {(search || itemType || annexure || category || language || vertical || credits || minHours || maxHours || minWeeks || maxWeeks) && (
            <button type="button" onClick={handleClearFilters}>Clear all filters</button>
          )}
        </div>

        {isLoading && <p role="status">Loading catalogue...</p>}

        {loadError && (
          <p className="auth-message" role="alert">{loadError}</p>
        )}

        {!isLoading && !loadError && courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map((item) => {
              const enrolled = isEnrolled(item.id);
              const duration = formatDuration(item);
              const meta = formatMeta(item);
              return (
                <article className="course-card" key={item.id}>
                  <div className="course-card-top">
                    <span className={`course-type-badge ${item.item_type}`}>
                      {item.item_type === "internship" ? "INTERNSHIP" : item.item_type === "project" ? "PROJECT" : "COURSE"}
                    </span>
                    {item.credits && (
                      <span className="course-credit-badge">
                        <Award size={14} /> {item.credits} Credits
                      </span>
                    )}
                  </div>

                  <div className="course-card-body">
                    <span className="course-category">
                      {item.source_category || item.item_type.toUpperCase()}
                    </span>
                    <h3>{item.title}</h3>
                    {item.description && <p className="course-description">{item.description}</p>}
                    {item.language && (
                      <span className="course-language">
                        <Globe size={14} /> {item.language}
                      </span>
                    )}

                    <div className="course-meta">
                      {duration && (
                        <span><Clock3 size={15} /> {duration}</span>
                      )}
                      {meta.length > 0 && (
                        <span>{meta.join(" • ")}</span>
                      )}
                    </div>

                    {item.skills && (
                      <div className="course-skills" aria-label="Skills">
                        {item.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="course-card-footer">
                    <button
                      type="button"
                      className="course-details-button"
                      onClick={() => handleOpen(item)}
                    >
                      View Details <ArrowRight size={16} />
                    </button>

                    {item.item_type === "course" && !enrolled ? (
                      <button
                        type="button"
                        className="course-enroll-button"
                        onClick={() => handleEnroll(item)}
                      >
                        Enroll now <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="course-enroll-button enrolled"
                        onClick={enrolled ? () => navigate("/student-dashboard") : () => handleBookDemo(item)}
                      >
                        {enrolled ? "Enrolled" : "Book Demo"}
                        {enrolled ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : !isLoading && !loadError ? (
          <div className="courses-empty-state">
            <Search size={34} />
            <h3>No matching records found</h3>
            <p>Try a different keyword or clear your filters to see all catalogue records.</p>
            <button type="button" onClick={handleClearFilters}>Show all records</button>
          </div>
        ) : null}

        {/* Pagination */}
        {total > limit && (
          <div className="courses-pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ← Prev
            </button>
            <span>Page {page} of {Math.ceil(total / limit)}</span>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
            >
              Next →
            </button>
          </div>
        )}

        <section className="courses-career-banner">
          <div>
            <span className="courses-kicker">YOUR NEXT STEP STARTS HERE</span>
            <h2>Learn a skill. Build a project. Grow your confidence.</h2>
            <p>
              Explore the course curriculum and use your student dashboard to
              track your enrollments.
            </p>
          </div>
          <button type="button" onClick={() => navigate("/student-dashboard")}>
            Student dashboard <ArrowRight size={17} />
          </button>
        </section>
      </section>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="course-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <section className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
            <button
              type="button"
              className="course-modal-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Close details"
            >
              <X size={21} />
            </button>

            <span className="course-modal-label">
              <BookOpen size={16} /> CATALOGUE DETAILS
            </span>
            <h2 id="course-modal-title">{selectedItem.title}</h2>

            <div className="course-modal-grid">
              <div className="course-modal-field">
                <span className="field-label">Section</span>
                <span className="field-value">{selectedItem.source_category}</span>
              </div>
              <div className="course-modal-field">
                <span className="field-label">Annexure</span>
                <span className="field-value">{selectedItem.source_annexure}</span>
              </div>
              <div className="course-modal-field">
                <span className="field-label">Type</span>
                <span className="field-value">{selectedItem.item_type}</span>
              </div>
              <div className="course-modal-field">
                <span className="field-label">Language</span>
                <span className="field-value">{selectedItem.language || "Not specified"}</span>
              </div>
              {selectedItem.vertical && (
                <div className="course-modal-field">
                  <span className="field-label">Vertical</span>
                  <span className="field-value">{selectedItem.vertical}</span>
                </div>
              )}
              {selectedItem.skills && (
                <div className="course-modal-field">
                  <span className="field-label">Skills / Subjects</span>
                  <span className="field-value">{selectedItem.skills}</span>
                </div>
              )}
              {selectedItem.delivery_mode && (
                <div className="course-modal-field">
                  <span className="field-label">Delivery Mode</span>
                  <span className="field-value">{selectedItem.delivery_mode}</span>
                </div>
              )}
              {selectedItem.credits && (
                <div className="course-modal-field">
                  <span className="field-label">Credits</span>
                  <span className="field-value">{selectedItem.credits}</span>
                </div>
              )}
              {selectedItem.duration_hours && (
                <div className="course-modal-field">
                  <span className="field-label">Duration (Hours)</span>
                  <span className="field-value">{selectedItem.duration_hours}</span>
                </div>
              )}
              {selectedItem.duration_weeks && (
                <div className="course-modal-field">
                  <span className="field-label">Duration (Weeks)</span>
                  <span className="field-value">{selectedItem.duration_weeks}</span>
                </div>
              )}
              {selectedItem.duration && (
                <div className="course-modal-field">
                  <span className="field-label">Duration</span>
                  <span className="field-value">{selectedItem.duration}</span>
                </div>
              )}
              <div className="course-modal-field">
                <span className="field-label">Public Status</span>
                <span className="field-value status-badge">{selectedItem.status}</span>
              </div>
            </div>

            {selectedItem.description && (
              <div className="course-modal-section">
                <h3>Description</h3>
                <p>{selectedItem.description}</p>
              </div>
            )}

            <div className="course-modal-actions">
              <button type="button" className="course-modal-secondary" onClick={() => setSelectedItem(null)}>
                Back to catalogue
              </button>
              {selectedItem.item_type === "course" && !isEnrolled(selectedItem.id) ? (
                <button type="button" className="course-modal-primary" onClick={() => handleEnroll(selectedItem)}>
                  Enroll in this course <ArrowRight size={17} />
                </button>
              ) : (
                <button type="button" className="course-modal-secondary" onClick={() => navigate("/student-dashboard")}>
                  Go to dashboard <ArrowRight size={17} />
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
