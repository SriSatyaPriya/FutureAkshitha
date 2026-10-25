import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  ClipboardCheck,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/demoStore";
import "./../App.css";

const plans = [
  {
    name: "Basic",
    description: "Build your placement preparation foundation.",
    features: [
      "Recorded learning sessions",
      "Study materials",
      "Practice assessments",
      "Placement preparation resources",
    ],
  },
  {
    name: "Standard",
    description: "Prepare with structured practice and guidance.",
    features: [
      "Everything in Basic",
      "Mock interview practice",
      "Resume review support",
      "Interview preparation",
    ],
  },
  {
    name: "Premium",
    description: "Get comprehensive placement preparation support.",
    features: [
      "Everything in Standard",
      "Live session access",
      "Detailed mock interview feedback",
      "Hiring opportunity updates",
    ],
  },
];

const benefits = [
  {
    icon: Video,
    title: "Live & recorded sessions",
    description: "Learn through scheduled sessions and recordings.",
  },
  {
    icon: BookOpen,
    title: "Learning materials",
    description: "Use study resources to strengthen your skills.",
  },
  {
    icon: MessageCircle,
    title: "Doubt support",
    description: "Get help with questions during your preparation.",
  },
  {
    icon: ClipboardCheck,
    title: "Mock interviews",
    description: "Practise interviews and identify areas to improve.",
  },
  {
    icon: FileText,
    title: "Resume preparation",
    description: "Prepare a clear, professional resume.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Career opportunities",
    description: "Explore relevant openings when available.",
  },
];

export default function PlacementTraining() {
  const user = getCurrentUser();
  const isStudent = user?.role?.toLowerCase() === "student";
  const [selectedPlan, setSelectedPlan] = useState("Standard");
  const [enrollment, setEnrollment] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isStudent) return undefined;
    let cancelled = false;

    apiRequest("/api/placement/my")
      .then((data) => {
        if (cancelled) return;
        setEnrollment(data.enrollment || null);
        if (data.enrollment?.plan) setSelectedPlan(data.enrollment.plan);
      })
      .catch(() => {
        if (!cancelled) setEnrollment(null);
      });

    return () => { cancelled = true; };
  }, [isStudent]);

  async function saveSelectedPlan() {
    if (!isStudent) {
      setMessageType("error");
      setMessage(
        user
          ? "Placement training plans can only be selected by student accounts."
          : "Please log in with a student account to select a plan."
      );
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const data = await apiRequest("/api/placement/plan", {
        method: "POST",
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const refreshed = await apiRequest("/api/placement/my");
      setEnrollment(refreshed.enrollment || null);

      setMessageType("success");
      setMessage(data.message || `Your ${selectedPlan} plan has been saved.`);
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Unable to save your plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="placement-page">
      <section className="placement-hero">
        <div className="placement-hero-content">
          <span className="placement-eyebrow">CAREER DEVELOPMENT PROGRAM</span>
          <h1>Placement & Training</h1>
          <p>
            Build your confidence, improve your interview skills, and prepare
            for your next career opportunity with structured placement training.
          </p>
          <div className="placement-hero-actions">
            <a href="#placement-plans" className="placement-primary-btn">
              Explore plans <ArrowRight size={17} />
            </a>
            <Link to="/internships" className="placement-secondary-btn">
              Explore internships
            </Link>
          </div>
        </div>
        <div className="placement-hero-icon">
          <GraduationCap size={76} />
        </div>
      </section>

      <section className="placement-section">
        <div className="placement-section-heading">
          <span className="placement-eyebrow">YOUR CAREER TOOLKIT</span>
          <h2>Everything you need to prepare</h2>
          <p>
            Develop practical skills and prepare for interviews with structured
            learning resources.
          </p>
        </div>
        <div className="placement-benefit-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article className="placement-benefit-card" key={benefit.title}>
                <div className="placement-benefit-icon"><Icon size={23} /></div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="placement-section" id="placement-plans">
        <div className="placement-section-heading">
          <span className="placement-eyebrow">CHOOSE YOUR PATH</span>
          <h2>Select a training plan</h2>
          <p>
            Select a plan to record your preference. Final prices and payment
            details must be confirmed by the platform administrator.
          </p>
        </div>

        <div className="placement-plan-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`placement-plan-card ${selectedPlan === plan.name ? "selected" : ""}`}
            >
              {selectedPlan === plan.name && (
                <span className="placement-selected-label">Selected plan</span>
              )}
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="placement-plan-price">Price to be confirmed</div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><CheckCircle size={17} /><span>{feature}</span></li>
                ))}
              </ul>
              <button
                type="button"
                className={selectedPlan === plan.name ? "placement-primary-btn" : "placement-secondary-btn"}
                aria-pressed={selectedPlan === plan.name}
                onClick={() => {
                  setSelectedPlan(plan.name);
                  setMessage("");
                }}
              >
                {selectedPlan === plan.name ? "Selected" : `Choose ${plan.name}`}
              </button>
            </article>
          ))}
        </div>

        <div className="placement-enrollment-panel">
          <h3>Ready to continue?</h3>
          <p>
            Save your preferred plan first, then complete your education details
            and submit your certificate and resume for review.
          </p>
          <button type="button" className="placement-primary-btn" onClick={saveSelectedPlan} disabled={isSaving}>
            {isSaving ? "Saving..." : <>Save selected plan <CheckCircle size={17} /></>}
          </button>

          {message && (
            <p
              className="placement-feedback"
              role={messageType === "success" ? "status" : "alert"}
              style={messageType === "success" ? { color: "#15803d" } : undefined}
            >
              {message}
            </p>
          )}

          {enrollment && (
            <div className="placement-current-status" aria-live="polite">
              <p><strong>Selected plan:</strong> {enrollment.plan || "Not selected"}</p>
              <p><strong>Verification status:</strong> {(enrollment.status || "not_submitted").replace(/_/g, " ")}</p>
              <p><strong>Payment status:</strong> {enrollment.payment_status === "paid" ? "Paid" : "Pending (see administrator)"}</p>
              {enrollment.reviewer_note && (
                <p><strong>Administrator note:</strong> {enrollment.reviewer_note}</p>
              )}
            </div>
          )}

          <Link to="/enrollment-verification" className="placement-primary-btn">
            Continue to enrollment <ArrowRight size={17} />
          </Link>
          {!user && (
            <p className="placement-feedback">
              <ShieldCheck size={16} /> Log in as a student to save a plan and submit enrollment details.
            </p>
          )}
        </div>
      </section>

      <section className="placement-next-steps">
        <h2>What happens next?</h2>
        <div className="placement-steps-grid">
          <div><span>01</span><h3>Select a plan</h3><p>Choose your preferred placement training plan.</p></div>
          <div><span>02</span><h3>Submit documents</h3><p>Provide your education details and required documents.</p></div>
          <div><span>03</span><h3>Verification</h3><p>Your submission can be reviewed by an administrator.</p></div>
          <div><span>04</span><h3>Access training</h3><p>Training access can be enabled after required approval and payment.</p></div>
        </div>
      </section>

      <div className="placement-footer-note">
        <Clock3 size={16} />
        <span>Plan prices, payment processing, live sessions and training access are not activated by selecting a plan alone.</span>
      </div>
    </main>
  );
}
