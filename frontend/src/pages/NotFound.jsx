import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Search, Compass } from "lucide-react";
import "./../App.css";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-card">
        <div className="not-found-illustration" aria-hidden="true">
          <span className="not-found-orbit not-found-orbit-one" />
          <span className="not-found-orbit not-found-orbit-two" />
          <div className="not-found-compass">
            <Compass size={42} strokeWidth={1.6} />
          </div>
        </div>

        <span className="not-found-code">404</span>

        <h1 id="not-found-title">Looks like you took a wrong turn</h1>

        <p>
          We couldn’t find that page. The link may be outdated, or the address
          may have been typed incorrectly.
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="not-found-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <Link to="/" className="not-found-home">
            <Home size={18} />
            Back to Home
          </Link>
        </div>

        <div className="not-found-help">
          <span className="not-found-help-icon" aria-hidden="true">
            <Search size={18} />
          </span>
          <div>
            <strong>Not sure where to go?</strong>
            <p>Start with a learning path or explore available opportunities.</p>
            <div className="not-found-shortcuts">
              <Link to="/courses">Explore courses</Link>
              <Link to="/internships">Browse internships</Link>
              <Link to="/careers">Career opportunities</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
