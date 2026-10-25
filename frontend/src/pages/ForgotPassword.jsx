
import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, ArrowRight } from "lucide-react";
import { apiRequest } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      setMessage(
        data.message ||
          "If your email is registered, a password reset link will be sent."
      );
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-logo">
          <GraduationCap size={32} />
        </div>

        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1 id="forgot-title">Forgot Password?</h1>

        <p className="auth-description">
          Enter your registered email address to start resetting your password.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="resetEmail">Email address</label>

          <div className="auth-input">
            <Mail size={18} aria-hidden="true" />
            <input
              id="resetEmail"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {message && (
            <p role="status" style={{ color: "#16a34a" }}>
              {message}
            </p>
          )}

          {error && (
            <p role="alert" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="auth-back">
          Back to home
        </Link>
      </section>
    </main>
  );
}
