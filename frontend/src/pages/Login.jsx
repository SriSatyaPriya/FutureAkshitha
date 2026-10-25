import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiRequest, setStoredToken } from "../services/api";
import { saveCurrentUser } from "../services/demoStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState("student");

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      if (!data.token || !data.user) {
        throw new Error("The server returned an invalid login response.");
      }

      const userRole = String(data.user.role || "").toLowerCase();

      if (userRole !== role) {
        setError(
          `This account is registered as ${userRole || "an unknown role"}. Please select the correct role.`
        );
        return;
      }

      setStoredToken(data.token);

      const currentUserSaved = saveCurrentUser({
        id: data.user.id,
        fullName: data.user.fullName || data.user.full_name || data.user.name || "",
        companyName: data.user.companyName || data.user.company_name || "",
        email: data.user.email,
        education: data.user.education || "",
        domain: data.user.domain || "IT",
        phone: data.user.phone || "",
        skills: data.user.skills || "",
        role: userRole,
      });

      if (!currentUserSaved) {
        setStoredToken(null);
        throw new Error("Unable to start your session. Please try again.");
      }

      const dashboardPaths = {
        student: "/student-dashboard",
        company: "/company-dashboard",
        admin: "/admin-dashboard",
      };

      navigate(dashboardPaths[userRole] || "/login", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo">
          <GraduationCap size={32} />
        </div>

        <span className="eyebrow">WELCOME BACK</span>
        <h1 id="login-title">Welcome Back</h1>
        <p className="auth-description">
          Sign in to access your courses, career opportunities, and personalized workspace.
        </p>

        <div className="auth-security-note">
          <ShieldCheck size={17} />
          <span>Sign in to your Future Akshitha account</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="loginRole">Sign in as</label>
          <div className="auth-input">
            <Users size={18} aria-hidden="true" />
            <select
              id="loginRole"
              name="role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setError("");
              }}
              required
            >
              <option value="student">Student</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <label htmlFor="loginEmail">Email address</label>
          <div className="auth-input">
            <Mail size={18} aria-hidden="true" />
            <input
              id="loginEmail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              required
            />
          </div>

          <label htmlFor="loginPassword">Password</label>
          <div className="auth-input">
            <Lock size={18} aria-hidden="true" />
            <input
              id="loginPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
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

          {error && (
            <p className="auth-message" role="alert">
              <AlertCircle size={17} />
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
          
          <div className="forgot-password-row">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

        </form>

        <p className="auth-switch">
          New to Future Akshitha? <Link to="/register">Create an account</Link>
        </p>
        <Link to="/" className="auth-back">Back to home</Link>
      </section>
    </main>
  );
}
