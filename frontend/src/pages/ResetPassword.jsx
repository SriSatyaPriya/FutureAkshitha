
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, Lock, ArrowRight } from "lucide-react";
import { apiRequest } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("This reset link is invalid. Please request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      setMessage(data.message || "Password reset successfully.");

      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <div className="auth-logo">
          <GraduationCap size={32} />
        </div>

        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1 id="reset-title">Reset Password</h1>

        <p className="auth-description">
          Create a new password for your Future Akshitha account.
        </p>

        {!token && (
          <p role="alert" style={{ color: "#ef4444" }}>
            This reset link is invalid or missing its token. Please request a new link.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="newPassword">New password</label>
          <div className="auth-input">
            <Lock size={18} aria-hidden="true" />
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <label htmlFor="confirmPassword">Confirm new password</label>
          <div className="auth-input">
            <Lock size={18} aria-hidden="true" />
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
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
            disabled={loading || !token}
          >
            {loading ? "Updating..." : "Update Password"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
