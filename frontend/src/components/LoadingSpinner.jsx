
import { LoaderCircle } from "lucide-react";
import "./LoadingSpinner.css";

export default function LoadingSpinner({
  message = "Loading...",
  fullPage = false,
}) {
  return (
    <div
      className={`loading-spinner ${
        fullPage ? "loading-spinner-full-page" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="loading-spinner-icon"
        size={32}
        aria-hidden="true"
      />
      <p>{message}</p>
    </div>
  );
}

