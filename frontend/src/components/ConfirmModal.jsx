import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import "./ConfirmModal.css";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  const dialogRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements?.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const previousElement = previousFocusRef.current;
      if (previousElement && typeof previousElement.focus === "function") {
        previousElement.focus();
      }
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
        tabIndex={-1}
      >
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onCancel}
          aria-label="Close confirmation"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="confirm-modal-icon" aria-hidden="true">
          <AlertTriangle size={28} />
        </div>

        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-modal-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-modal-confirm ${
              danger ? "confirm-modal-danger" : ""
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}
