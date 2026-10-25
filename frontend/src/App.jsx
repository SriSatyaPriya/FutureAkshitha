import { useState, useEffect } from "react";
import {
  ArrowRight, BookOpen, BriefcaseBusiness, GraduationCap,
  Menu, X, Users, Target, Code, Cloud, Database,
  Globe2, ShieldCheck, TrendingUp,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation
} from "react-router-dom";
import { getCurrentUser } from "./services/demoStore";
import { apiRequest } from "./services/api";
import Courses from "./pages/Courses";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StudentDashboard from "./pages/StudentDashboard";
import Internships from "./pages/Internships";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LearningJourney from "./pages/LearningJourney";
import PlacementTraining from "./pages/PlacementTraining";
import EnrollmentVerification from "./pages/EnrollmentVerification";
import EnrollmentReview from "./pages/EnrollmentReview";
import Careers from "./pages/Careers";
import NotFound from "./pages/NotFound";
import "./App.css";



function ScrollToHashElement() {
  const location = useLocation();

    useEffect(() => {
    if (!location.hash) {
      // Smooth scroll to the top of the page with our own frames — a native
      // smooth scroll left in flight would race the next section navigation.
        if (
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        window.scrollTo({ top: 0, behavior: "instant" });
        return undefined;
      }
      const startY = window.scrollY;
      const startTime = performance.now();
      const duration = Math.min(
        1400,
        Math.max(400, Math.abs(startY) * 0.35)
      );
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      let cancelled = false;
      let rafId;
      const step = () => {
        if (cancelled) return;
        const progress = Math.min(
          (performance.now() - startTime) / duration,
          1
        );
        window.scrollTo({ top: startY * (1 - easeOut(progress)), behavior: "instant" });
        if (progress < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }

    const sectionId = decodeURIComponent(location.hash.substring(1));
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Stop automatic re-alignment once the user scrolls on their own.
    let userInterrupted = false;
    const markUserInterrupted = () => {
      userInterrupted = true;
    };
    const stopEvents = ["wheel", "touchstart"];
    stopEvents.forEach((ev) =>
      window.addEventListener(ev, markUserInterrupted, {
        once: true,
        passive: true,
      })
    );

    const navbarHeight = () => {
      const navbar = document.querySelector(".navbar");
      return navbar ? navbar.offsetHeight : 90;
    };

    // Live target: the section's top edge, exactly below the sticky navbar.
    const targetFor = () => {
      const element = document.getElementById(sectionId);
      if (!element) return null;
      return Math.max(
        element.getBoundingClientRect().top + window.scrollY - navbarHeight() - 8,
        0
      );
    };

    const alignInstant = () => {
      const target = targetFor();
      if (target === null) return;
      if (Math.abs(window.scrollY - target) > 1) {
        window.scrollTo({ top: target, behavior: "instant" });
      }
    };

    // Drive the smooth scroll ourselves, recomputing the target every frame.
    // Unlike a browser smooth scroll it cannot be left half-finished by
    // another navigation, and it absorbs layout shifts from images/fonts or
    // data that finish loading mid-flight.
    let cancelled = false;
    let rafId;
    if (reducedMotion) {
      alignInstant();
    } else {
      const startY = window.scrollY;
      const startTime = performance.now();
      // Scale the duration to the distance so long jumps don't feel violent
      // and short hops still feel responsive.
      const firstTarget = targetFor();
      const duration =
        firstTarget === null
          ? 650
          : Math.min(1400, Math.max(400, Math.abs(firstTarget - startY) * 0.35));
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const step = () => {
        if (cancelled || userInterrupted) return;
        const target = targetFor();
        if (target === null) return;
        const progress = Math.min(
          (performance.now() - startTime) / duration,
          1
        );
        window.scrollTo({
          top: startY + (target - startY) * easeOut(progress),
          behavior: "instant",
        });
        if (progress < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }

    // After arriving, keep re-aligning for ~5s so late layout changes (e.g. a
    // section's images expanding) can't push the wrong content into view.
    const ro = new ResizeObserver(() => {
      if (!userInterrupted) alignInstant();
    });
    ro.observe(document.body);

    const settleTimer = setInterval(() => {
      if (!userInterrupted) alignInstant();
    }, 400);

    const stopTimer = setTimeout(() => {
      clearInterval(settleTimer);
      ro.disconnect();
      stopEvents.forEach((ev) => window.removeEventListener(ev, markUserInterrupted));
    }, 5000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearInterval(settleTimer);
      clearTimeout(stopTimer);
      ro.disconnect();
      stopEvents.forEach((ev) =>
        window.removeEventListener(ev, markUserInterrupted)
      );
    };
  }, [location.key, location.hash]);

  return null;
}


function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const links = [
    { label: "Home", to: "/" },
    { label: "About", to: "/#about" },
    { label: "Services", to: "/#services" },
    { label: "Courses", to: "/#courses" },
    { label: "Internships", to: "/#internships" },
    { label: "Projects", to: "/#projects" },
    { label: "Colleges", to: "/#colleges" },
    { label: "Testimonials", to: "/#testimonials" },
    { label: "Contact", to: "/#contact" },
  ];

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={closeMenu}>
        <span className="brand-icon">
          <GraduationCap size={27} />
        </span>
        <span>
          Future <strong>Akshitha</strong>
          <small>LEARN • GROW • ACHIEVE</small>
        </span>
      </Link>

      <div className="navbar-actions">
        <Link
          to="/register"
          className="nav-cta mobile-nav-cta"
          onClick={closeMenu}
        >
          Get Started <ArrowRight size={16} />
        </Link>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <nav className={menuOpen ? "nav-links open" : "nav-links"}>
        {links.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            onClick={closeMenu}
          >
            {item.label}
          </Link>
        ))}

        <Link
          to="/login"
          className="mobile-login-link"
          onClick={closeMenu}
        >
          Sign in
        </Link>

        <Link
          to="/register"
          className="nav-cta"
          onClick={closeMenu}
        >
          Get Started <ArrowRight size={16} />
        </Link>
      </nav>
    </header>
  );
}


function Home() {
  return (
    <main>
      <section className="hero" id="home">
        <div className="hero-content">
          <span className="eyebrow">YOUR FUTURE STARTS HERE</span>
          <h1>Build Skills.<br />Find Opportunity.<br /><span>Start Your Career.</span></h1>
          <p>Learn in-demand skills, discover internships, connect with companies, and take your next step with confidence.</p>
          <div className="hero-actions">
            <Link to="/#courses" className="button button-gold">Explore Courses <ArrowRight size={18} /></Link>
            <a href="#internships" className="button button-outline">Explore Internships</a>
          </div>
          <div className="hero-note"><Users size={17} /> Learn, practice and prepare for your next opportunity.</div>
        </div>

      </section>

      <section className="benefits">
        <div><BookOpen /><span><strong>Skill Development</strong><small>Learn with purpose</small></span></div>
        <div><Target /><span><strong>Career Guidance</strong><small>Follow a clear path</small></span></div>
        <div><BriefcaseBusiness /><span><strong>Internship Access</strong><small>Explore opportunities</small></span></div>
        <div><Users /><span><strong>Industry Connections</strong><small>Meet employers</small></span></div>
      </section>

       {/* About Us Section */}
      <section className="about-us-section" id="about">
        <div className="about-us-container">
          <div className="about-us-intro">
            <span className="about-kicker">
              <span className="about-kicker-line" />
              GET TO KNOW US
            </span>

            <h2>
              More Than Learning.
              <br />
              <span>A Future of Possibilities.</span>
            </h2>

            <p className="about-lead">
              Future Akshitha is built to help learners turn their
              ambitions into practical skills, meaningful experiences,
              and career opportunities.
            </p>

            <p className="about-description">
              We bring learning, project-based practice, internship
              discovery, and career preparation together in one
              connected platform. Our vision is to make career
              development more accessible to students across India.
            </p>

            <div className="about-values">
              <div className="about-value">
                <span className="about-value-icon"><BookOpen size={20} /></span>
                <div>
                  <h3>Learn with Purpose</h3>
                  <p>Build relevant knowledge and practical skills.</p>
                </div>
              </div>

              <div className="about-value">
                <span className="about-value-icon"><Code size={20} /></span>
                <div>
                  <h3>Build with Confidence</h3>
                  <p>Turn ideas into projects and portfolio experience.</p>
                </div>
              </div>

              <div className="about-value">
                <span className="about-value-icon"><Target size={20} /></span>
                <div>
                  <h3>Move Towards Your Goals</h3>
                  <p>Explore career paths and relevant opportunities.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-us-right">
            <div className="about-vision-card">
              <div className="about-card-icon"><Target size={24} /></div>
              <div>
                <span>01 / OUR MISSION</span>
                <h3>Make learning lead somewhere.</h3>
                <p>
                  Connect education with hands-on practice,
                  career preparation, and opportunities to grow.
                </p>
              </div>
            </div>

            <div className="about-vision-card">
              <div className="about-card-icon"><Globe2 size={24} /></div>
              <div>
                <span>02 / OUR VISION</span>
                <h3>Opportunity without boundaries.</h3>
                <p>
                  Help learners across India discover pathways
                  that match their interests and aspirations.
                </p>
              </div>
            </div>

            <div className="about-vision-card">
              <div className="about-card-icon"><ShieldCheck size={24} /></div>
              <div>
                <span>03 / OUR COMMITMENT</span>
                <h3>Progress through practice.</h3>
                <p>
                  Encourage continuous learning, real-world
                  projects, and informed career decisions.
                </p>
              </div>
            </div>

            <div className="ceo-message-card">
              <div className="ceo-profile">
                <img
                  src="/chandrasekhar-ceo.png"
                  alt="Chandrasekhar S, CEO of Akshitha Edutech"
                  className="ceo-photo"
                />

                <div>
                  <span className="ceo-label">A NOTE FROM OUR LEADERSHIP</span>
                  <h3>Chandrasekhar S</h3>
                  <p>CEO, Akshitha Edutech Pvt Ltd</p>
                </div>
              </div>

              <div className="ceo-quote-mark">“</div>

              <blockquote>
                Our aim is to help learners move beyond theory,
                develop practical capabilities, and prepare for
                opportunities that align with their ambitions.
              </blockquote>

              <div className="ceo-message-footer">
                <span />
                <small>LEARN. GROW. ACHIEVE.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-showcase" id="services">
        <div className="services-container">
          <div className="services-heading">
            <span className="services-eyebrow">
              <span /> HOW WE HELP YOU GROW <span />
            </span>

            <h2>
              Everything You Need to
              <br />
              <span>Move Forward</span>
            </h2>

            <p>
              From building in-demand skills to exploring career opportunities,
              discover the support you need at every stage of your journey.
            </p>
          </div>

          <div className="services-grid">
            <article className="service-card service-blue">
              <div className="service-card-top">
                <div className="service-icon"><Code size={27} /></div>
                <span className="service-number">01</span>
              </div>
              <span className="service-label">BUILD YOUR FOUNDATION</span>
              <h3>Skill Training</h3>
              <p>
                Strengthen your technical and professional skills through
                structured learning paths, guided practice, and career-focused
                preparation.
              </p>
              <div className="service-tags">
                <span>Full Stack</span><span>Python</span><span>Cloud</span>
                <span>Communication</span>
              </div>
              <Link to="/courses" className="service-link">
                Explore learning paths <ArrowRight size={17} />
              </Link>
            </article>

            <article className="service-card service-cyan">
              <div className="service-card-top">
                <div className="service-icon"><BriefcaseBusiness size={27} /></div>
                <span className="service-number">02</span>
              </div>
              <span className="service-label">LEARN BY DOING</span>
              <h3>Real-Time Internships</h3>
              <p>
                Discover internship opportunities that help you understand
                workplace expectations, apply your knowledge, and gain practical
                experience.
              </p>
              <div className="service-tags">
                <span>Practical Tasks</span><span>Mentorship</span>
                <span>Career Exposure</span>
              </div>
              <Link to="/#internships" className="service-link">
                Explore internships <ArrowRight size={17} />
              </Link>
            </article>

            <article className="service-card service-green">
              <div className="service-card-top">
                <div className="service-icon"><Users size={27} /></div>
                <span className="service-number">03</span>
              </div>
              <span className="service-label">PREPARE FOR OPPORTUNITIES</span>
              <h3>Placement Support</h3>
              <p>
                Prepare for the next step with resume guidance, interview
                practice, professional communication, and job-readiness
                resources.
              </p>
              <div className="service-tags">
                <span>Resume Building</span><span>Mock Interviews</span>
                <span>Job Readiness</span>
              </div>
              <Link to="/careers" className="service-link">
                Prepare for your career <ArrowRight size={17} />
              </Link>
            </article>

            <article className="service-card service-orange">
              <div className="service-card-top">
                <div className="service-icon"><Database size={27} /></div>
                <span className="service-number">04</span>
              </div>
              <span className="service-label">TURN IDEAS INTO ACTION</span>
              <h3>Live Projects</h3>
              <p>
                Develop your problem-solving abilities by working on practical
                project ideas, building portfolio pieces, and presenting what
                you create.
              </p>
              <div className="service-tags">
                <span>Mini Projects</span><span>Portfolio</span>
                <span>Problem Solving</span>
              </div>
              <Link to="/courses" className="service-link">
                Start building skills <ArrowRight size={17} />
              </Link>
            </article>

            <article className="service-card service-purple">
              <div className="service-card-top">
                <div className="service-icon"><GraduationCap size={27} /></div>
                <span className="service-number">05</span>
              </div>
              <span className="service-label">GROW TOGETHER</span>
              <h3>College Collaborations</h3>
              <p>
                Create pathways for academic and industry engagement through
                learning initiatives, workshops, project activities, and
                career-readiness programs.
              </p>
              <div className="service-tags">
                <span>Workshops</span><span>Campus Programs</span>
                <span>Industry Connect</span>
              </div>
              <Link to="/register" className="service-link">
                Partner with us <ArrowRight size={17} />
              </Link>
            </article>

            <article className="service-card service-pink">
              <div className="service-card-top">
                <div className="service-icon"><Target size={27} /></div>
                <span className="service-number">06</span>
              </div>
              <span className="service-label">FIND YOUR DIRECTION</span>
              <h3>Career Guidance</h3>
              <p>
                Explore IT and Non-IT career paths, identify useful skills,
                understand your next steps, and prepare a more focused
                learning roadmap.
              </p>
              <div className="service-tags">
                <span>Career Paths</span><span>Roadmaps</span>
                <span>Skill Planning</span>
              </div>
              <Link to="/careers" className="service-link">
                Explore career paths <ArrowRight size={17} />
              </Link>
            </article>
          </div>

          <div className="services-bottom">
            <div>
              <span className="services-bottom-kicker">YOUR JOURNEY STARTS HERE</span>
              <h3>One step today. More possibilities tomorrow.</h3>
            </div>
            <Link to="/courses" className="services-cta">
              Discover Your Path <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>


     

      <section id="courses" className="courses-home-section">
        <Courses />
      </section>

      <section
        id="internships"
        className="internships-home-section"
      >
        <Internships />
      </section>

      {/* Projects Section */}
      <section className="industry-projects" id="projects">
        <div className="projects-heading">
          <span className="projects-eyebrow">
            <span /> BUILD REAL THINGS <span />
          </span>
          <h2>
            Industry <span>Projects</span>
          </h2>
          <p>
            Work on real-world projects that strengthen your portfolio
            and make you stand out to employers.
          </p>
        </div>

        <div className="industry-projects-grid">
          <article className="industry-project-card">
            <div className="industry-project-icon icon-purple">
              <span style={{ fontSize: 29, fontWeight: 700 }}>✳</span>
            </div>
            <h3>AI Projects</h3>
            <span className="project-external"></span>
            <p>
              Chatbots, image recognition, NLP systems, and recommendation
              engines built with TensorFlow and Python.
            </p>
            <div className="project-count">25+ Projects</div>
          </article>

          <article className="industry-project-card featured-project">
            <div className="industry-project-icon icon-blue">
              <Globe2 size={29} />
            </div>
            <h3>Web Development Projects</h3>
            <span className="project-external"></span>
            <p>
              Full-stack web applications using modern React, Node.js,
              Django frameworks with real deployments.
            </p>
            <div className="project-count">40+ Projects</div>
          </article>

          <article className="industry-project-card">
            <div className="industry-project-icon icon-green">
              <Code size={29} />
            </div>
            <h3>IoT Projects</h3>
            <span className="project-external"></span>
            <p>
              Smart home automation, sensor-based systems, and
              Raspberry Pi / Arduino projects.
            </p>
            <div className="project-count">15+ Projects</div>
          </article>

          <article className="industry-project-card">
            <div className="industry-project-icon icon-orange">
              <TrendingUp size={29} />
            </div>
            <h3>Data Science Projects</h3>
            <span className="project-external"></span>
            <p>
              End-to-end ML pipelines, data visualization dashboards,
              and predictive analytics solutions.
            </p>
            <div className="project-count">30+ Projects</div>
          </article>

          <article className="industry-project-card featured-project">
            <div className="industry-project-icon icon-cyan">
              <BriefcaseBusiness size={29} />
            </div>
            <h3>Mobile App Projects</h3>
            <span className="project-external"></span>
            <p>
              Cross-platform Flutter and React Native apps for Android
              and iOS with backend integration.
            </p>
            <div className="project-count">20+ Projects</div>
          </article>

          <article className="industry-project-card">
            <div className="industry-project-icon icon-pink">
              <Cloud size={29} />
            </div>
            <h3>Cloud Projects</h3>
            <span className="project-external"></span>
            <p>
              AWS deployments, serverless architectures, cloud migrations,
              and DevOps automation.
            </p>
            <div className="project-count">18+ Projects</div>
          </article>
        </div>

        <div className="projects-action">
          <Link to="/courses" className="projects-journey-button">
            Start Your Project Journey <ArrowRight size={19} />
          </Link>
        </div>
      </section>


      {/* Colleges Section */}

      {/* Colleges Partnership Section */}
      <section className="college-hub" id="colleges">
        <div className="college-hub-container">

          <div className="college-intro">
            <span className="college-mini-label">
              COLLABORATION THAT CREATES OPPORTUNITY
            </span>

            <h2>
              Better Campuses.
              <br />
              <span>Brighter Careers.</span>
            </h2>

            <p>
              We bring colleges, educators, and learners together to
              connect academic knowledge with practical experience
              and career-focused development.
            </p>
          </div>

          <div className="college-path">
            <div className="college-path-line" />

            <article className="college-path-item">
              <div className="college-path-icon">
                <BookOpen size={24} />
              </div>
              <span className="college-path-step">01 — LEARN</span>
              <h3>Build Skills</h3>
              <p>
                Strengthen technical knowledge and professional skills
                through structured learning.
              </p>
            </article>

            <article className="college-path-item">
              <div className="college-path-icon">
                <Code size={24} />
              </div>
              <span className="college-path-step">02 — APPLY</span>
              <h3>Create & Explore</h3>
              <p>
                Encourage hands-on projects and exploration of
                internship opportunities.
              </p>
            </article>

            <article className="college-path-item">
              <div className="college-path-icon">
                <Users size={24} />
              </div>
              <span className="college-path-step">03 — COLLABORATE</span>
              <h3>Grow Together</h3>
              <p>
                Explore academic collaboration, faculty engagement,
                and campus learning initiatives.
              </p>
            </article>

            <article className="college-path-item">
              <div className="college-path-icon">
                <Target size={24} />
              </div>
              <span className="college-path-step">04 — PREPARE</span>
              <h3>Move Forward</h3>
              <p>
                Help students prepare for career opportunities with
                guidance and interview practice.
              </p>
            </article>
          </div>

          <div className="college-partner-banner">
            <div className="college-partner-copy">
              <span>FOR COLLEGES & INSTITUTIONS</span>
              <h3>Let's shape the next generation of talent.</h3>
              <p>
                Have a vision for your students? Let's explore how
                Future Akshitha can support your institution.
              </p>
            </div>

            <Link to="/register" className="college-partner-button">
              Discuss a Partnership <ArrowRight size={18} />
            </Link>
          </div>

        </div>
      </section>


      {/* Testimonials + FAQs Section */}
      <section className="testimonials-faq-section" id="testimonials">
        <div className="testimonials-faq-container">

          {/* Testimonials Heading */}
          <div className="testimonials-heading">
            <span className="testimonials-label">
              LEARNER EXPERIENCES
            </span>

            <h2>
              Every Step Forward <span>Matters.</span>
            </h2>

            <p>
              Explore how structured learning, practical projects,
              and career preparation can support a learner's journey.
            </p>
          </div>

          {/* Testimonial Cards */}

          <div className="testimonial-grid">

            <article className="testimonial-card">
              <span className="testimonial-category">SKILL DEVELOPMENT</span>
              <p className="testimonial-review">
                "The structured learning approach helped me strengthen
                my fundamentals and apply new skills to practical problems."
              </p>
              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-blue">S</div>
                <div className="testimonial-person-info">
                  <h3>Student Learner</h3>
                  <span>Skill Development</span>
                </div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

            <article className="testimonial-card">
              <span className="testimonial-category">PROJECT LEARNING</span>
              <p className="testimonial-review">
                "Working on practical projects helped me connect concepts
                with real applications and improve my problem-solving skills."
              </p>
              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-purple">P</div>
                <div className="testimonial-person-info">
                  <h3>Project Learner</h3>
                  <span>Practical Projects</span>
                </div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

            <article className="testimonial-card">
              <span className="testimonial-category">CAREER READINESS</span>
              <p className="testimonial-review">
                "Resume preparation and interview practice helped me
                understand how to present my skills more confidently."
              </p>
              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-cyan">C</div>
                <div className="testimonial-person-info">
                  <h3>Career Learner</h3>
                  <span>Career Preparation</span>
                </div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

            <article className="testimonial-card">
              <span className="testimonial-category">INTERNSHIP LEARNING</span>
              <p className="testimonial-review">
                "Guided learning activities helped me understand
                workplace expectations and the importance of continuous learning."
              </p>
              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-blue">I</div>
                <div className="testimonial-person-info">
                  <h3>Internship Learner</h3>
                  <span>Internship Preparation</span>
                </div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

            <article className="testimonial-card">
              <span className="testimonial-category">LEARNING JOURNEY</span>
              <p className="testimonial-review">
                "Having clear learning goals helped me track my progress,
                recognize gaps in my knowledge, and plan my next steps."
              </p>
              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-purple">L</div>
                <div className="testimonial-person-info">
                  <h3>Learning Program Participant</h3>
                  <span>Personal Development</span>
                </div>
                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

            <article className="testimonial-card">
              <span className="testimonial-category">COLLEGE COLLABORATION</span>

              <p className="testimonial-review">
                "Collaborative learning activities helped me explore new
                opportunities, improve my communication, and understand
                how teamwork supports professional growth."
              </p>

              <div className="testimonial-person">
                <div className="testimonial-avatar avatar-cyan">C</div>

                <div className="testimonial-person-info">
                  <h3>College Learner</h3>
                  <span>Academic Collaboration</span>
                </div>

                <div className="testimonial-stars">★★★★★</div>
              </div>
            </article>

          </div>


          {/* FAQs inside the same section */}
          <div className="testimonials-faq-content" id="faqs">

            <div className="faq-heading">
              <span className="testimonials-label">NEED TO KNOW MORE?</span>
              <h2>Frequently Asked <span>Questions</span></h2>
              <p>
                Find answers about learning, internships, registration,
                and college partnerships.
              </p>
            </div>

            <div className="faq-list">

              <details className="faq-item">
                <summary>What is Future Akshitha?</summary>
                <p>
                  Future Akshitha is designed to connect learners with
                  skill development, practical projects, internship
                  opportunities, and career preparation.
                </p>
              </details>

              <details className="faq-item">
                <summary>Who can register on the platform?</summary>
                <p>
                  Students and eligible learners can register to explore
                  available programs. Requirements may vary by program.
                </p>
              </details>

              <details className="faq-item">
                <summary>Do I need programming knowledge to join?</summary>
                <p>
                  Not for every program. Check the prerequisites of your
                  chosen course before registering.
                </p>
              </details>

              <details className="faq-item">
                <summary>Are internship opportunities available?</summary>
                <p>
                  Internship opportunities may be offered through the
                  platform. Check individual listings for availability,
                  eligibility, duration, and selection requirements.
                </p>
              </details>

              <details className="faq-item">
                <summary>Will I receive a certificate after completing a course?</summary>
                <p>
                  Certificate availability depends on the particular
                  program and its completion requirements. Check the
                  course details before enrolling.
                </p>
              </details>

              <details className="faq-item">
                <summary>How can my college collaborate with Future Akshitha?</summary>
                <p>
                  Colleges can contact the team to discuss possible
                  skill development programs, workshops, projects,
                  and academic collaborations.
                </p>
              </details>

              <details className="faq-item">
                <summary>How do I get started?</summary>
                <p>
                  Visit the registration page, create your account,
                  and explore the learning opportunities that match
                  your interests and goals.
                </p>
              </details>

            </div>

            <div className="faq-contact">
              <div>
                <h3>Still have questions?</h3>
                <p>Connect with our team for more information.</p>
              </div>

              <Link to="/#contact" className="faq-contact-button">
                Contact Us <ArrowRight size={18} />
              </Link>
            </div>

          </div>

        </div>
      </section>



      {/* Innovative Contact Section */}
      <section className="contact-modern" id="contact">
        <div className="contact-modern-container">

          <div className="contact-modern-heading">
            <span className="contact-modern-eyebrow">
              LET'S BUILD SOMETHING MEANINGFUL
            </span>

            <h2>
              Your Next Chapter
              <br />
              <span>Starts With a Conversation.</span>
            </h2>

            <p>
              Whether you're a student, college, or organization,
              let's explore how Future Akshitha can support your goals.
            </p>
          </div>

          <div className="contact-modern-grid">

            {/* Contact details */}
            <div className="contact-modern-left">

              <div className="contact-welcome-card">
                <span className="contact-card-label">CONNECT WITH US</span>
                <h3>Ideas grow when we connect.</h3>
                <p>
                  Have a question, partnership idea, or learning goal?
                  Choose the contact option that works best for you.
                </p>
                <div className="contact-availability">
                  <span className="contact-status-dot" />
                  We're here to hear from you
                </div>
              </div>

              <a
                className="contact-detail-card"
                href="tel:+919133949509"
              >
                <span className="contact-detail-icon">☎</span>
                <span className="contact-detail-copy">
                  <small>PHONE</small>
                  <strong>+91 9133949509</strong>
                </span>
                <span className="contact-detail-arrow">↗</span>
              </a>

              <a
                className="contact-detail-card"
                href="mailto:ceo@akshithaedutech.com"
              >
                <span className="contact-detail-icon">✉</span>
                <span className="contact-detail-copy">
                  <small>CEO EMAIL</small>
                  <strong>ceo@akshithaedutech.com</strong>
                </span>
                <span className="contact-detail-arrow">↗</span>
              </a>

              <a
                className="contact-detail-card"
                href="mailto:akshithaedu@gmail.com"
              >
                <span className="contact-detail-icon">✉</span>
                <span className="contact-detail-copy">
                  <small>GENERAL ENQUIRIES</small>
                  <strong>akshithaedu@gmail.com</strong>
                </span>
                <span className="contact-detail-arrow">↗</span>
              </a>

              <a
                className="contact-detail-card"
                href="https://akshithaedutek.com"
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-detail-icon">◎</span>
                <span className="contact-detail-copy">
                  <small>WEBSITE</small>
                  <strong>akshithaedutek.com</strong>
                </span>
                <span className="contact-detail-arrow">↗</span>
              </a>

              <div className="contact-ceo-card">
                <div className="contact-ceo-avatar">CS</div>
                <div>
                  <span>CEO · DIRECT CONTACT</span>
                  <h3>Chandrasekhar S</h3>
                  <a href="tel:+919133949509">+91 9133949509</a>
                </div>
              </div>

              <div className="contact-social-note">
                <span>BUILDING CONNECTIONS</span>
                <p>
                  Let's create meaningful opportunities through learning
                  and collaboration.
                </p>
              </div>

            </div>

            {/* Inquiry form */}
            <div className="contact-form-panel">
              <div className="contact-form-heading">
                <span className="contact-card-label">SEND A MESSAGE</span>
                <h3>Let's talk about your goals.</h3>
                <p>Share a few details so we can understand your enquiry.</p>
              </div>

              <form
                className="contact-modern-form"
                onSubmit={async (e) => {
                  e.preventDefault();

                  const form = e.currentTarget;
                  const data = new FormData(form);
                  const submitButton = form.querySelector("button[type='submit']");
                  const noticeElement = form.parentElement.querySelector(
                    ".contact-submit-status"
                  );

                  const showMessage = (text, isError) => {
                    if (!noticeElement) return;
                    noticeElement.textContent = text;
                    noticeElement.style.display = "block";
                    noticeElement.style.color = isError ? "#b91c1c" : "#166534";
                  };

                  showMessage("Sending your enquiry...", false);
                  if (submitButton) submitButton.disabled = true;

                  try {
                    const response = await apiRequest("/api/contact", {
                      method: "POST",
                      body: JSON.stringify({
                        fullName: data.get("fullName"),
                        email: data.get("email"),
                        phone: data.get("phone") || "",
                        organization: data.get("organization") || "",
                        enquiryType: data.get("enquiryType"),
                        message: data.get("message"),
                      }),
                    });

                    showMessage(
                      response.message ||
                        "Your enquiry has been received. Our team will reach out to you.",
                      false
                    );
                    form.reset();
                  } catch (error) {
                    showMessage(
                      error.message || "Unable to submit your enquiry. Please try again.",
                      true
                    );
                  } finally {
                    if (submitButton) submitButton.disabled = false;
                  }
                }}
              >
                <div className="contact-form-row">
                  <label>
                    Full Name *
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    Email Address *
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                </div>

                <div className="contact-form-row">
                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 XXXXX XXXXX"
                      autoComplete="tel"
                    />
                  </label>

                  <label>
                    College / Company
                    <input
                      type="text"
                      name="organization"
                      placeholder="Your institution or company"
                      autoComplete="organization"
                    />
                  </label>
                </div>

                <label>
                  What can we help you with? *
                  <select name="enquiryType" defaultValue="" required>
                    <option value="" disabled>Select an enquiry type</option>
                    <option value="Courses and Training">Courses & Training</option>
                    <option value="Internships">Internships</option>
                    <option value="College Partnership">College Partnership</option>
                    <option value="Projects">Projects</option>
                    <option value="Career Guidance">Career Guidance</option>
                    <option value="Other Enquiry">Other Enquiry</option>
                  </select>
                </label>

                <label>
                  Your Message *
                  <textarea
                    name="message"
                    placeholder="Tell us about your goals or requirements..."
                    rows={5}
                    required
                  />
                </label>

                <button type="submit" className="contact-submit-button">
                  Submit Enquiry <span>↗</span>
                </button>

                <p
                  className="contact-submit-status contact-form-disclaimer"
                  role="status"
                ></p>

                <p className="contact-form-disclaimer">
                  Your enquiry is stored securely and our team will respond directly.
                </p>
              </form>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}


function ProtectedRoute({ allowedRoles, children }) {
  const user = getCurrentUser();

  // Redirect users who are not logged in.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toLowerCase();

  // Send users to their own dashboard if they lack permission.
  if (!allowedRoles.includes(role)) {
    const dashboardPaths = {
      student: "/student-dashboard",
      company: "/company-dashboard",
      admin: "/admin-dashboard",
    };

    return (
      <Navigate
        to={dashboardPaths[role] || "/login"}
        replace
      />
    );
  }

  return children;
}


function App() {
  return (
    <div className="app">
      <ScrollToHashElement />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="*" element={<NotFound />} />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/company-dashboard"
          element={
            <ProtectedRoute allowedRoles={["company"]}>
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/courses" element={<Courses />} />

        <Route
          path="/learning-journey"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <LearningJourney />
            </ProtectedRoute>
          }
        />

        <Route
          path="/placement-training"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <PlacementTraining />
            </ProtectedRoute>
          }
        />

        <Route
          path="/enrollment-verification"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <EnrollmentVerification />
            </ProtectedRoute>
          }
        />


        <Route
          path="/enrollment-review"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EnrollmentReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/careers"
          element={<Careers />}
        />

      </Routes>

      {/* Future Akshitha — Modern Footer */}
      <footer className="ak-footer" id="footer">
        <div className="ak-footer-container">

          <div className="ak-footer-main">

            {/* Brand */}
            <div className="ak-footer-brand">
              <Link to="/#home" className="ak-footer-logo">
                <span className="ak-footer-logo-icon">
                  <GraduationCap size={25} />
                </span>
                <span>
                  <strong><span>AKSHITHA</span> EDUTECH</strong>
                  <small>Private Limited</small>
                </span>
              </Link>

              <p className="ak-footer-description">
                India's career acceleration platform, connecting
                education with practical skills, internships,
                and meaningful opportunities.
              </p>

              <div className="ak-footer-tagline">
                <span>LEARN.</span>
                <span>BUILD.</span>
                <span>GROW.</span>
              </div>
            </div>

            {/* Explore */}
            <div className="ak-footer-column">
              <h3>Explore</h3>
              <Link to="/#about">About Us</Link>
              <Link to="/#services">Our Services</Link>
              <Link to="/#courses">Courses</Link>
              <Link to="/#internships">Internships</Link>
              <Link to="/#projects">Projects</Link>
              <Link to="/#testimonials">Testimonials & FAQs</Link>
            </div>

            {/* Opportunities */}
            <div className="ak-footer-column">
              <h3>Opportunities</h3>
              <Link to="/#colleges">College Partnerships</Link>
              <Link to="/#contact">Collaborate With Us</Link>
              <Link to="/learning-journey">Learning Journey</Link>
              <Link to="/placement-training">Placement Training</Link>
              <Link to="/register">Join Our Community</Link>
            </div>

            {/* Contact */}
            <div className="ak-footer-column ak-footer-contact">
              <h3>Let's Connect</h3>

              <a href="tel:+919133949509">
                <Phone size={16} />
                <span>+91 9133949509</span>
              </a>

              <a href="mailto:ceo@akshithaedutech.com">
                <Mail size={16} />
                <span>ceo@akshithaedutech.com</span>
              </a>

              <a href="mailto:akshithaedu@gmail.com">
                <Mail size={16} />
                <span>akshithaedu@gmail.com</span>
              </a>

              <a
                href="https://akshithaedutek.com"
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={16} />
                <span>akshithaedutek.com</span>
              </a>

              <Link to="/#contact" className="ak-footer-contact-button">
                Get in Touch <ArrowRight size={16} />
              </Link>
            </div>

          </div>

          {/* Bottom strip */}
          <div className="ak-footer-bottom">
            <p>
              © {new Date().getFullYear()} AKSHITHA EDUTECH Pvt Ltd.
              All rights reserved.
            </p>

            <div className="ak-footer-bottom-links">
              <Link to="/#contact">Contact</Link>
              <Link to="/#faqs">FAQs</Link>
              <Link to="/#home">Back to Top ↑</Link>
            </div>
          </div>

        </div>
      </footer>


      {/* Floating WhatsApp Button */}
      <a
        className="ak-whatsapp-float"
        href="https://wa.me/919133949509?text=Hello%20Future%20Akshitha%2C%20I%27d%20like%20to%20know%20more%20about%20your%20courses%20and%20opportunities."
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Future Akshitha on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <svg
          viewBox="0 0 32 32"
          width="29"
          height="29"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16 3.2A12.7 12.7 0 0 0 5.1 22.4L3.4 28.7l6.5-1.7A12.7 12.7 0 1 0 16 3.2Zm0 23.1c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.8 1 1-3.7-.2-.4A10.3 10.3 0 1 1 16 26.3Zm5.7-7.7c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.4 8.4 0 0 1-2.5-1.5 9.4 9.4 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.7-.1 1.8-.7 2.1-1.4s.3-1.3.2-1.4-.3-.3-.6-.5Z" />
        </svg>
      </a>
    </div>
  );
}

export default App;
