
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import "./Notification.css";

const notificationTypes = {
  success: {
    icon: CheckCircle,
    className: "notification-success",
  },
  error: {
    icon: AlertCircle,
    className: "notification-error",
  },
  info: {
    icon: Info,
    className: "notification-info",
  },
};

export default function Notification({
  type = "info",
  message,
  onClose,
}) {
  if (!message) return null;

  const notification =
    notificationTypes[type] || notificationTypes.info;

  const Icon = notification.icon;

  return (
    <div
      className={`app-notification ${notification.className}`}
      role={type === "error" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" />

      <p>{message}</p>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
