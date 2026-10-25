import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Clock3,
  BookOpen,
  Code2,
  Cloud,
  ShieldCheck,
  Smartphone,
  BarChart3,
  BrainCircuit,
  GitBranch,
  X,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  BriefcaseBusiness,
  Sparkles,
  Layers3,
} from "lucide-react";
import { getCurrentUser } from "../services/demoStore";
import { apiRequest } from "../services/api";

const COURSES = [
  {
    id: "python-full-stack",
    title: "Python Full Stack",
    category: "IT",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Most Popular",
    icon: Code2,
    description:
      "Build modern web applications by learning Python, backend development, frontend interfaces, and databases.",
    skills: ["Python", "Django", "React", "PostgreSQL"],
    modules: [
      "Programming fundamentals with Python",
      "Functions, OOP, and error handling",
      "Django and REST API fundamentals",
      "HTML, CSS, JavaScript, and React",
      "PostgreSQL and database operations",
      "Full-stack project and deployment basics",
    ],
    outcomes: [
      "Understand full-stack application architecture",
      "Build frontend interfaces and backend APIs",
      "Connect applications to a relational database",
      "Create a portfolio-ready practice project",
    ],
    careers: ["Python Developer", "Full Stack Developer", "Backend Developer"],
  },
  {
    id: "aws-cloud",
    title: "AWS Cloud",
    category: "IT",
    duration: "2 Months",
    level: "Beginner to Advanced",
    badge: "In Demand",
    icon: Cloud,
    description:
      "Explore cloud computing concepts, AWS services, storage, compute, and deployment fundamentals.",
    skills: ["EC2", "S3", "Lambda", "DevOps"],
    modules: [
      "Cloud computing fundamentals",
      "AWS account and core service overview",
      "EC2 compute and virtual servers",
      "S3 storage and access concepts",
      "Introduction to AWS Lambda",
      "Cloud deployment and a guided project",
    ],
    outcomes: [
      "Explain core cloud computing concepts",
      "Understand common AWS services",
      "Recognize basic cloud deployment workflows",
      "Practice designing a simple cloud solution",
    ],
    careers: ["Cloud Support Associate", "Cloud Engineer Trainee", "AWS Associate"],
  },
  {
    id: "cyber-security",
    title: "Cyber Security",
    category: "IT",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "High Demand",
    icon: ShieldCheck,
    description:
      "Learn security fundamentals, network protection, ethical security practices, and threat awareness.",
    skills: ["Ethical Hacking", "Network Security", "Pen Testing"],
    modules: [
      "Cybersecurity fundamentals",
      "Networking and common protocols",
      "Operating system security basics",
      "Threats, vulnerabilities, and risk",
      "Introduction to ethical penetration testing",
      "Security best practices and case studies",
    ],
    outcomes: [
      "Understand common cybersecurity threats",
      "Identify basic network security concepts",
      "Explain vulnerability and risk management",
      "Practice security concepts in authorized labs",
    ],
    careers: ["Security Analyst Trainee", "SOC Analyst Trainee", "Security Support Associate"],
  },
  {
    id: "flutter-app-development",
    title: "Flutter App Development",
    category: "IT",
    duration: "2 Months",
    level: "Beginner to Advanced",
    badge: "New",
    icon: Smartphone,
    description:
      "Explore cross-platform mobile application development using Flutter, Dart, and Firebase fundamentals.",
    skills: ["Flutter", "Dart", "Firebase", "UI Design"],
    modules: [
      "Mobile application development basics",
      "Dart programming fundamentals",
      "Flutter widgets and layouts",
      "Navigation, forms, and state basics",
      "Firebase introduction",
      "Build a sample mobile application",
    ],
    outcomes: [
      "Understand Flutter app structure",
      "Create responsive mobile interfaces",
      "Work with basic navigation and forms",
      "Build a small mobile app project",
    ],
    careers: ["Flutter Developer Trainee", "Mobile App Developer", "UI Developer Trainee"],
  },
  {
    id: "data-science",
    title: "Data Science",
    category: "IT",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Top Pick",
    icon: BarChart3,
    description:
      "Learn how to explore datasets, analyze information, create visualizations, and understand machine learning basics.",
    skills: ["Python", "Pandas", "ML", "Tableau"],
    modules: [
      "Data science and analytics fundamentals",
      "Python for data analysis",
      "Working with Pandas and datasets",
      "Data cleaning and exploratory analysis",
      "Visualization and Tableau fundamentals",
      "Introduction to machine learning",
    ],
    outcomes: [
      "Clean and explore structured datasets",
      "Perform basic data analysis with Python",
      "Communicate findings using visualizations",
      "Develop a guided data analysis project",
    ],
    careers: ["Data Analyst Trainee", "Junior Data Analyst", "Reporting Analyst"],
  },
  {
    id: "java-full-stack",
    title: "Java Full Stack",
    category: "IT",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Corporate Favorite",
    icon: Code2,
    description:
      "Develop web application skills with Java, Spring Boot, frontend technologies, and relational databases.",
    skills: ["Java", "Spring Boot", "Angular", "MySQL"],
    modules: [
      "Java programming fundamentals",
      "OOP and Java collections",
      "SQL and MySQL basics",
      "Spring Boot and REST APIs",
      "Angular frontend fundamentals",
      "Full-stack integration project",
    ],
    outcomes: [
      "Apply Java programming fundamentals",
      "Understand REST API development",
      "Connect backend services to a database",
      "Build a guided full-stack application",
    ],
    careers: ["Java Developer Trainee", "Backend Developer", "Full Stack Developer"],
  },
  {
    id: "ai-machine-learning",
    title: "AI & Machine Learning",
    category: "IT",
    duration: "4 Months",
    level: "Intermediate to Advanced",
    badge: "Future-Ready",
    icon: BrainCircuit,
    description:
      "Explore machine learning, neural networks, language processing, and computer vision through guided projects.",
    skills: ["TensorFlow", "Keras", "NLP", "Computer Vision"],
    modules: [
      "AI and machine learning fundamentals",
      "Data preparation and feature concepts",
      "Supervised and unsupervised learning",
      "Neural networks with TensorFlow and Keras",
      "Introduction to natural language processing",
      "Computer vision concepts and guided project",
    ],
    outcomes: [
      "Explain core machine learning workflows",
      "Understand model training and evaluation",
      "Explore NLP and computer vision use cases",
      "Develop a guided AI/ML practice project",
    ],
    careers: ["Machine Learning Trainee", "AI Associate", "Junior Data Scientist"],
  },
  {
    id: "devops",
    title: "DevOps",
    category: "IT",
    duration: "2 Months",
    level: "Intermediate to Advanced",
    badge: "Industry Essential",
    icon: GitBranch,
    description:
      "Understand modern delivery workflows, containers, orchestration, automation, and infrastructure concepts.",
    skills: ["Docker", "Kubernetes", "CI/CD", "Terraform"],
    modules: [
      "DevOps culture and lifecycle",
      "Git and version control workflows",
      "Docker and container fundamentals",
      "Kubernetes concepts",
      "CI/CD pipeline fundamentals",
      "Infrastructure as code with Terraform",
    ],
    outcomes: [
      "Explain the DevOps lifecycle",
      "Understand containerization fundamentals",
      "Describe CI/CD pipeline workflows",
      "Practice a guided deployment workflow",
    ],
    careers: ["DevOps Trainee", "Build and Release Associate", "Cloud Operations Trainee"],
  },
  {
    id: "web-development",
    title: "Web Development",
    category: "IT",
    duration: "4 Months",
    level: "Beginner to Advanced",
    badge: "Popular",
    icon: Code2,
    description: "Learn HTML, CSS, JavaScript, React, and modern frontend development to build interactive web applications.",
    skills: ["HTML5", "CSS3", "JavaScript", "React", "Git"],
    modules: [
      "Web development foundations and semantic HTML",
      "CSS styling, Flexbox, and Grid responsive layouts",
      "JavaScript essentials and DOM manipulation",
      "Modern ES6+ syntax and API integration",
      "React component architecture and state management",
      "Responsive design, performance, and project deployment",
    ],
    outcomes: [
      "Build responsive and mobile-friendly web pages",
      "Write interactive JavaScript code for modern browsers",
      "Create modular applications using React",
      "Deploy web applications to production hosting",
    ],
    careers: ["Frontend Developer", "Web Developer", "UI Developer Trainee"],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    category: "Non-IT",
    domainCategory: "Career Readiness",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "In Demand",
    icon: BriefcaseBusiness,
    description: "Master search engine optimization, content strategy, social media campaigns, and web analytics.",
    skills: ["SEO", "Social Media", "Content Strategy", "Google Analytics", "Email Marketing"],
    modules: [
      "Digital marketing fundamentals and strategy",
      "Search Engine Optimization (SEO) and keyword research",
      "Social media marketing and engagement campaigns",
      "Content creation, copywriting, and planning",
      "Google Analytics and performance measurement",
      "End-to-end digital marketing capstone project",
    ],
    outcomes: [
      "Plan and execute multichannel marketing campaigns",
      "Optimize web pages for search engines",
      "Analyze visitor metrics and conversion rates",
      "Build and manage digital brand presence",
    ],
    careers: ["Digital Marketing Executive", "SEO Specialist", "Social Media Coordinator"],
  },
  {
    id: "spoken-english",
    title: "Spoken English",
    category: "Non-IT",
    domainCategory: "Spoken English",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Communication Skills",
    icon: BookOpen,
    description: "Build confidence in everyday and professional English communication through speaking and practice activities.",
    skills: ["Speaking Practice", "Vocabulary", "Grammar", "Pronunciation"],
    modules: [
      "English communication foundations",
      "Everyday vocabulary and sentence building",
      "Grammar for clear communication",
      "Pronunciation and listening practice",
      "Group discussions and speaking activities",
      "Professional introductions and conversations",
    ],
    outcomes: [
      "Practise everyday English conversations",
      "Build vocabulary and clearer sentence structure",
      "Improve listening and speaking confidence",
      "Prepare and deliver a short self-introduction",
    ],
    careers: ["Customer Support", "Front Office Associate", "Communication-focused Roles"],
  },
  {
    id: "banking-exams",
    title: "Banking Exams",
    category: "Non-IT",
    domainCategory: "Competitive Exams",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Exam Preparation",
    icon: GraduationCap,
    description: "Prepare for banking exam topics with structured practice across aptitude, reasoning, English, and general awareness.",
    skills: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"],
    modules: [
      "Exam pattern and preparation planning",
      "Quantitative aptitude fundamentals",
      "Logical and analytical reasoning",
      "English language practice",
      "Banking and general awareness",
      "Timed practice tests and revision",
    ],
    outcomes: [
      "Understand common banking exam sections",
      "Practise quantitative aptitude and reasoning",
      "Strengthen English and general awareness",
      "Build a structured revision routine",
    ],
    careers: ["Banking Exam Aspirant", "Public Sector Bank Exam Aspirant", "Financial Services Exam Aspirant"],
  },
  {
    id: "soft-skills",
    title: "Soft Skills",
    category: "Non-IT",
    domainCategory: "Soft Skills",
    duration: "3 Months",
    level: "Beginner to Advanced",
    badge: "Career Readiness",
    icon: BriefcaseBusiness,
    description: "Develop workplace communication, teamwork, time management, and interview readiness through practical exercises.",
    skills: ["Communication", "Teamwork", "Time Management", "Interview Skills"],
    modules: [
      "Workplace communication fundamentals",
      "Teamwork and collaboration",
      "Time management and prioritisation",
      "Problem-solving and professional behaviour",
      "Interview preparation and mock practice",
      "Presentation and group discussion practice",
    ],
    outcomes: [
      "Communicate more clearly in professional settings",
      "Practise teamwork and collaboration",
      "Organise tasks and prioritise responsibilities",
      "Prepare for interviews and group discussions",
    ],
    careers: ["Graduate Trainee", "Customer Support Associate", "Entry-level Professional Roles"],
  },
];

const FILTERS = ["All Courses", "IT", "Non-IT"];
const LEVELS = ["All Levels", "Beginner to Advanced", "Intermediate to Advanced"];

function normalizeId(value) {
  return String(value ?? "").trim();
}

export default function Courses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Courses");
  const [level, setLevel] = useState("All Levels");
  const [nonItCategory, setNonItCategory] = useState("All Non-IT Categories");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await apiRequest("/api/courses");
        const rows = Array.isArray(response)
          ? response
          : response.data || response.courses || [];

        const databaseCourses = rows.map((item) => {
          const courseTitle = String(item.title || "").toLowerCase();

          const details = COURSES.find((course) => {
            const title = course.title.toLowerCase();

            return (
              title === courseTitle ||
              (title === "java full stack" &&
                courseTitle.includes("java full stack")) ||
              (title === "python full stack" &&
                (courseTitle.includes("python programming") || courseTitle.includes("python"))) ||
              (title === "data science" &&
                courseTitle.includes("data science")) ||
              (title === "spoken english" &&
                courseTitle.includes("business communication")) ||
              (title === "web development" &&
                courseTitle.includes("web")) ||
              (title === "digital marketing" &&
                courseTitle.includes("digital marketing"))
            );
          });

          return {
            ...details,
            id: Number(item.id),
            title: item.title,
            description: item.description || details?.description || "",
            category: item.domain || details?.category || "IT",
            duration: item.duration || details?.duration || "To be announced",
            fee: Number(item.fee || 0),
            level: details?.level || "Beginner to Advanced",
            badge: details?.badge || "Available",
            icon: details?.icon || Code2,
            skills: details?.skills || [],
            modules: details?.modules || [],
            outcomes: details?.outcomes || [],
            careers: details?.careers || [],
            domainCategory: details?.domainCategory || "",
          };
        });

        if (!cancelled) {
          setCourses(databaseCourses);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Unable to load courses.");
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
          const rows = Array.isArray(response)
            ? response
            : response.data || response.enrollments || [];

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
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSelectedCourse(null);
      }
    }
    if (selectedCourse) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCourse]);

  const myEnrollments = useMemo(() => {
    if (!currentUser?.id) return [];

    return enrollments.filter(
      (item) => normalizeId(item.studentId) === normalizeId(currentUser.id)
    );
  }, [enrollments, currentUser]);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return courses.filter((course) => {
      const searchableText = [
        course.title,
        course.description,
        course.category,
        course.domainCategory ?? "",
        course.level,
        course.duration,
        ...course.skills,
        ...course.modules,
        ...course.outcomes,
        ...course.careers,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);
      const matchesCategory =
        category === "All Courses" || course.category === category;
      const matchesLevel =
        level === "All Levels" || course.level === level;
      const matchesNonItCategory =
        category !== "Non-IT" ||
        nonItCategory === "All Non-IT Categories" ||
        course.domainCategory === nonItCategory;

      return matchesSearch && matchesCategory && matchesLevel && matchesNonItCategory;
    });
  }, [courses, search, category, level, nonItCategory]);

  function isEnrolled(courseId) {
    return myEnrollments.some(
      (item) => normalizeId(item.courseId) === normalizeId(courseId)
    );
  }

  async function handleEnroll(course) {
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

    if (!Number.isInteger(Number(course.id))) {
      setNotice("This course has an invalid database ID.");
      return;
    }

    try {
      await apiRequest("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(course.id),
        }),
      });

      const response = await apiRequest("/api/enrollments/my");
      const rows = Array.isArray(response)
        ? response
        : response.data || response.enrollments || [];

      setEnrollments(
        rows.map((item) => ({
          id: item.id,
          studentId: item.student_id ?? item.studentId ?? user.id,
          courseId: item.course_id ?? item.courseId ?? course.id,
          courseTitle: item.title ?? item.course_title ?? item.courseTitle ?? course.title,
          status: item.status,
        }))
      );

      setNotice(`Enrollment request submitted for ${course.title}!`);
      setSelectedCourse(null);
    } catch (err) {
      const errMsg = String(err.message || "");
      if (errMsg.toLowerCase().includes("already enrolled")) {
        try {
          const response = await apiRequest("/api/enrollments/my");
          const rows = Array.isArray(response)
            ? response
            : response.data || response.enrollments || [];
          setEnrollments(
            rows.map((item) => ({
              id: item.id,
              studentId: item.student_id ?? item.studentId ?? user.id,
              courseId: item.course_id ?? item.courseId,
              courseTitle: item.title ?? item.course_title ?? item.courseTitle ?? course.title,
              status: item.status,
            }))
          );
        } catch {
          // ignore refresh error
        }
        setNotice(`You are already enrolled in ${course.title}.`);
      } else if (errMsg.toLowerCase().includes("token") || errMsg.toLowerCase().includes("log in")) {
        setNotice("Your session has expired. Please sign in again.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setNotice(errMsg || "Unable to enroll. Please try again.");
      }
    }
  }

  async function handleBookDemo(course) {
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
      const res = await apiRequest(`/api/courses/${course.id}/demo`, { method: "POST" });
      setNotice(res.message || "Demo request received.");
      setSelectedCourse(null);
    } catch (err) {
      setNotice(err.message || "Unable to request a demo. Please try again.");
    }
  }

  function handleOpenCourse(course) {
    setNotice("");
    setSelectedCourse(course);
  }

  function handleContinue() {
    setSelectedCourse(null);
    navigate("/student-dashboard");
  }

  const enrolledCount = myEnrollments.length;

  return (
    <main className="courses-page">
      <section className="courses-hero">
        <div className="courses-hero-glow" aria-hidden="true" />
        <div className="courses-hero-content">
          <span className="courses-eyebrow">
            <Sparkles size={15} /> LEARN • BUILD • GROW
          </span>

          <h1>
            Find Your <span>Next Skill</span>
          </h1>

          <p>
            Industry-inspired learning paths to help you build practical
            skills, create projects, and prepare for your next career step.
          </p>

          <div className="courses-hero-stats">
            <div>
              <strong>{courses.length}+</strong>
              <span>Learning paths</span>
            </div>
            <div>
              <strong>Project-led</strong>
              <span>Practice-focused content</span>
            </div>
            <div>
              <strong>Career-aware</strong>
              <span>Skills for your next step</span>
            </div>
          </div>
        </div>
      </section>

      <section className="courses-main">
        <div className="courses-section-heading">
          <div>
            <span className="courses-kicker">EXPLORE OUR PROGRAMS</span>
            <h2>Courses designed for your future</h2>
            <p>
              Explore each curriculum, compare learning paths, and choose a
              course that matches your goals.
            </p>
          </div>

          {currentUser?.role?.toLowerCase() === "student" && (
            <div className="courses-enrolled-summary">
              <GraduationCap size={21} />
              <div>
                <strong>{enrolledCount}</strong>
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

        <div className="courses-toolbar">
          <label className="courses-search">
            <Search size={19} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Python, React, AWS, AI..."
              aria-label="Search courses and skills"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <div className="courses-filter-group" aria-label="Filter by category">
            {FILTERS.map((filter) => (
              <button
                type="button"
                key={filter}
                className={category === filter ? "active" : ""}
                onClick={() => setCategory(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {category === "Non-IT" && (
            <label className="courses-level-select">
              <span className="sr-only">Filter Non-IT course category</span>
              <select
                value={nonItCategory}
                onChange={(event) => setNonItCategory(event.target.value)}
                aria-label="Filter Non-IT course category"
              >
                {["All Non-IT Categories", "Spoken English", "Competitive Exams", "Soft Skills"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          )}

          <label className="courses-level-select">
            <span className="sr-only">Filter by course level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="courses-results-line">
          <span>
            Showing <strong>{filteredCourses.length}</strong> of {courses.length}{" "}
            courses
          </span>
          {(search || category !== "All Courses" || level !== "All Levels") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All Courses");
                setLevel("All Levels");
                setNonItCategory("All Non-IT Categories");
              }}
            >
              Clear all filters
            </button>
          )}
        </div>

        {isLoading && <p role="status">Loading courses...</p>}

        {loadError && (
          <p className="auth-message" role="alert">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && filteredCourses.length > 0 ? (
          <div className="courses-grid">
            {filteredCourses.map((course) => {
              const Icon = course.icon;
              const enrolled = isEnrolled(course.id);

              return (
                <article className="course-card" key={course.id}>
                  <div className="course-card-top">
                    <div className="course-icon">
                      <Icon size={27} strokeWidth={1.8} />
                    </div>
                    <span className="course-badge">{course.badge}</span>
                  </div>

                  <div className="course-card-body">
                    <span className="course-category">
                      {course.category === "Non-IT"
                        ? `${course.domainCategory || "CAREER SKILLS"} • NON-IT`
                        : `${course.category} PROGRAM`}
                    </span>
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>

                    <div className="course-meta">
                      <span>
                        <Clock3 size={15} /> {course.duration}
                      </span>
                      <span>
                        <Layers3 size={15} /> {course.level}
                      </span>
                    </div>

                    {course.skills && course.skills.length > 0 && (
                      <div className="course-skills" aria-label="Course skills">
                        {course.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="course-card-footer">
                    <button
                      type="button"
                      className="course-details-button"
                      onClick={() => handleOpenCourse(course)}
                    >
                      Explore course <ArrowRight size={16} />
                    </button>

                    {enrolled ? (
                      <button
                        type="button"
                        className="course-enroll-button enrolled"
                        onClick={handleContinue}
                      >
                        Enrolled <CheckCircle2 size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="course-enroll-button"
                        onClick={() => handleEnroll(course)}
                      >
                        Enroll now <ArrowRight size={16} />
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
            <h3>No matching courses found</h3>
            <p>Try a different keyword or clear your filters to see all courses.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All Courses");
                setLevel("All Levels");
                setNonItCategory("All Non-IT Categories");
              }}
            >
              Show all courses
            </button>
          </div>
        ) : null}

        <section className="courses-career-banner">
          <div className="courses-career-icon">
            <BriefcaseBusiness size={28} />
          </div>
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

      {selectedCourse && (
        <div
          className="course-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCourse(null);
          }}
        >
          <section
            className="course-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-modal-title"
          >
            <button
              type="button"
              className="course-modal-close"
              onClick={() => setSelectedCourse(null)}
              aria-label="Close course details"
            >
              <X size={21} />
            </button>

            <span className="course-modal-label">
              <BookOpen size={16} /> COURSE OVERVIEW
            </span>
            <h2 id="course-modal-title">{selectedCourse.title}</h2>
            <p className="course-modal-description">
              {selectedCourse.description}
            </p>

            <div className="course-modal-meta">
              <span>
                <Clock3 size={16} /> {selectedCourse.duration}
              </span>
              <span>
                <Layers3 size={16} /> {selectedCourse.level}
              </span>
            </div>

            {selectedCourse.skills && selectedCourse.skills.length > 0 && (
              <div className="course-modal-section">
                <h3>What you’ll learn</h3>
                <div className="course-modal-skills">
                  {selectedCourse.skills.map((skill) => (
                    <span key={skill}>
                      <CheckCircle2 size={14} /> {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCourse.modules && selectedCourse.modules.length > 0 && (
              <div className="course-modal-section">
                <h3>Learning curriculum</h3>
                <ol className="course-module-list">
                  {selectedCourse.modules.map((module, index) => (
                    <li key={module}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {module}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selectedCourse.outcomes && selectedCourse.outcomes.length > 0 && (
              <div className="course-modal-section">
                <h3>Learning outcomes</h3>
                <ul className="course-outcomes-list">
                  {selectedCourse.outcomes.map((outcome) => (
                    <li key={outcome}>
                      <CheckCircle2 size={16} /> {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCourse.careers && selectedCourse.careers.length > 0 && (
              <div className="course-modal-section">
                <h3>Related career paths</h3>
                <div className="course-career-tags">
                  {selectedCourse.careers.map((career) => (
                    <span key={career}>{career}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="course-modal-actions">
              <button
                type="button"
                className="course-modal-secondary"
                onClick={() => handleBookDemo(selectedCourse)}
              >
                Book a free session
              </button>
              <button
                type="button"
                className="course-modal-secondary"
                onClick={() => setSelectedCourse(null)}
              >
                Back to courses
              </button>
              {isEnrolled(selectedCourse.id) ? (
                <button
                  type="button"
                  className="course-modal-primary"
                  onClick={handleContinue}
                >
                  Go to dashboard <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  className="course-modal-primary"
                  onClick={() => handleEnroll(selectedCourse)}
                >
                  Enroll in this course <ArrowRight size={17} />
                </button>
              )}
            </div>
            <p className="course-demo-disclaimer">
              Course outlines are draft demo content. The reference PDF lists
              these Non-IT examples as 3-month courses, but does not confirm fees,
              next-batch dates, or faculty details. Confirm these with the institute
              before publishing.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
