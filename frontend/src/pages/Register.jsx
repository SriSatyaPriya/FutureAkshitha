import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  User,
  Users,
  Mail,
  Lock,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Phone,
} from "lucide-react";

import { apiRequest, setStoredToken } from "../services/api";
import { saveCurrentUser } from "../services/demoStore";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    education: "",
    domain: "IT",
    role: "student",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
    setMessageType("error");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    const fullName = form.fullName.trim();
    const companyName = form.companyName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const role = form.role === "company" ? "company" : "student";

    if (!email || !password || (role === "student" && !fullName) || (role === "company" && !companyName)) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (role === "student" && fullName.length < 2) {
      setMessage("Please enter your full name using at least 2 characters.");
      return;
    }

    if (role === "company" && companyName.length < 2) {
      setMessage("Please enter a company name using at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (role === "student" && !form.education) {
      setMessage("Please select your highest education.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Persist user in MySQL database
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: role === "company" ? companyName : fullName,
          email,
          phone: form.phone.trim(),
          password,
          role,
          ...(role === "student"
            ? {
                education: form.education.trim(),
                domain: form.domain.trim(),
              }
            : {}),
        }),
      });

      // 2. Automatically authenticate to obtain JWT token
      const loginData = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!loginData.token || !loginData.user) {
        setMessageType("success");
        setMessage("Account created successfully! Please sign in.");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }

      // 3. Save auth token and user state
      setStoredToken(loginData.token);

      saveCurrentUser({
        id: loginData.user.id,
        fullName: loginData.user.full_name || loginData.user.fullName || (role === "company" ? companyName : fullName),
        companyName: role === "company" ? companyName : "",
        email: loginData.user.email,
        education: loginData.user.education || (role === "student" ? form.education : ""),
        domain: loginData.user.domain || form.domain || "IT",
        phone: loginData.user.phone || "",
        skills: loginData.user.skills || "",
        role: loginData.user.role || role,
      });

      const dashboardPaths = {
        student: "/student-dashboard",
        company: "/company-dashboard",
      };

      navigate(dashboardPaths[role] || "/login");
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "Unable to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-logo">
          <GraduationCap size={32} />
        </div>

        <span className="eyebrow">START YOUR JOURNEY</span>
        <h1 id="register-title">Create Account</h1>
        <p className="auth-description">
          Join Future Akshitha to build your skills, discover opportunities, and grow your career.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="accountRole">I want to register as</label>
          <div className="auth-input">
            <Users size={18} aria-hidden="true" />
            <select
              id="accountRole"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="student">Student</option>
              <option value="company">Company</option>
            </select>
          </div>

          {form.role === "student" ? (
            <>
              <label htmlFor="fullName">Full name</label>
              <div className="auth-input">
                <User size={18} aria-hidden="true" />
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
            </>
          ) : (
            <>
              <label htmlFor="companyName">Company name</label>
              <div className="auth-input">
                <Building2 size={18} aria-hidden="true" />
                <input
                  id="companyName"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Enter your company name"
                  autoComplete="organization"
                  minLength={2}
                  maxLength={150}
                  required
                />
              </div>
            </>
          )}

          <label htmlFor="registerEmail">Email address</label>
          <div className="auth-input">
            <Mail size={18} aria-hidden="true" />
            <input
              id="registerEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          <label htmlFor="registerPhone">Mobile Number</label>
          <div className="auth-input">
            <Phone size={18} aria-hidden="true" />
            <input
              id="registerPhone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your 10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              minLength={10}
              required
            />
          </div>

          <label htmlFor="registerPassword">Password</label>
          <div className="auth-input">
            <Lock size={18} aria-hidden="true" />
            <input
              id="registerPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="auth-field-hint">Use at least 8 characters for your password.</p>

          {form.role === "student" && (
            <>
              <label htmlFor="education">Highest education</label>
              <div className="auth-input">
                <BookOpen size={18} aria-hidden="true" />
                <select
                  id="education"
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select education</option>
                  <option value="10th">10th</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </>
          )}

          <label htmlFor="domain">Interested domain</label>
          <select
            id="domain"
            name="domain"
            value={form.domain}
            onChange={handleChange}
            required
          >
            <option value="IT">IT</option>
            <option value="Non-IT">Non-IT</option>
          </select>

          {message && (
            <p className={`auth-message ${messageType === "success" ? "auth-message-success" : ""}`} role={messageType === "success" ? "status" : "alert"}>
              {messageType === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
              {message}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        <Link to="/" className="auth-back">Back to home</Link>
      </section>
    </main>
  );
}
