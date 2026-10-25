import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  clearCurrentUser,
} from "../services/demoStore";

const navigation = {
  student: [
    { label: "Dashboard", path: "/student-dashboard", icon: "⌂" },
    { label: "My Courses", path: "/courses", icon: "▤" },
    { label: "Learning Journey", path: "/learning-journey", icon: "◎" },
    { label: "Internships", path: "/internships", icon: "◇" },
    { label: "Careers", path: "/careers", icon: "↗" },
    { label: "Placement Training", path: "/placement-training", icon: "▣" },
    {
      label: "Document Verification",
      path: "/enrollment-verification",
      icon: "✓",
    },
  ],
  company: [
    { label: "Dashboard", path: "/company-dashboard", icon: "⌂" },
    { label: "Internships", path: "/internships", icon: "◇" },
    { label: "Careers", path: "/careers", icon: "↗" },
  ],
  admin: [
    { label: "Dashboard", path: "/admin-dashboard", icon: "⌂" },
    { label: "Enrollment Review", path: "/enrollment-review", icon: "✓" },
    { label: "Careers", path: "/careers", icon: "↗" },
  ],
};

export default function DashboardLayout({
  title,
  subtitle,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 768
  );
  const user = getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const role = user?.role?.toLowerCase() || "student";
  const links = navigation[role] || navigation.student;

  function handleLogout() {
    clearCurrentUser();
    navigate("/login", { replace: true });
  }

  const styles = {
    shell: {
      minHeight: "100vh",
      background: "#F5F7FC",
      color: "#17233F",
      display: "flex",
      fontFamily: "Inter, Arial, sans-serif",
      position: "relative",
    },
    sidebar: {
      width: "250px",
      minHeight: "100vh",
      flex: "0 0 250px",
      background: "#071735",
      color: "#FFFFFF",
      padding: "28px 16px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      zIndex: 30,
      ...(isMobile
        ? {
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            width: "min(290px, 86vw)",
            minHeight: 0,
            overflowY: "auto",
            boxShadow: "12px 0 35px rgba(4, 15, 38, 0.24)",
            transform: menuOpen ? "translateX(0)" : "translateX(-110%)",
            visibility: menuOpen ? "visible" : "hidden",
            transition: "transform 180ms ease, visibility 180ms ease",
          }
        : {}),
    },
    brand: {
      color: "#E7C77F",
      fontSize: "20px",
      lineHeight: 1.3,
      fontWeight: 800,
      padding: "0 12px 24px",
      borderBottom: "1px solid #263553",
      marginBottom: "24px",
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "6px",
      color: "#D7E0EF",
      textDecoration: "none",
      fontSize: "14px",
      lineHeight: 1.4,
      transition: "background 160ms ease, color 160ms ease",
      outlineOffset: "3px",
    },
    main: {
      flex: 1,
      minWidth: 0,
      width: 0,
    },
    header: {
      minHeight: "82px",
      background: "#FFFFFF",
      borderBottom: "1px solid #E6EAF2",
      padding: "16px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
      zIndex: 20,
    },
    content: {
      padding: isMobile ? "20px 16px" : "28px",
      maxWidth: "1500px",
      width: "100%",
      boxSizing: "border-box",
      margin: "0 auto",
    },
    menuButton: {
      display: isMobile ? "inline-flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "42px",
      minHeight: "42px",
      border: "1px solid #DCE3EF",
      background: "#FFFFFF",
      color: "#102447",
      borderRadius: "9px",
      padding: "8px 11px",
      cursor: "pointer",
      fontSize: "20px",
      flexShrink: 0,
    },
    logout: {
      border: "1px solid #D8B56D",
      background: "#FFF9ED",
      color: "#654B1B",
      padding: "10px 15px",
      borderRadius: "9px",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: "14px",
      flexShrink: 0,
    },
    overlay: {
      display: isMobile && menuOpen ? "block" : "none",
      position: "fixed",
      inset: 0,
      background: "rgba(4, 13, 32, 0.52)",
      border: 0,
      padding: 0,
      margin: 0,
      zIndex: 25,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.shell}>
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isMobile && menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
        style={styles.overlay}
      />

      <aside
        id="dashboard-navigation"
        aria-label={`${role} navigation`}
        style={styles.sidebar}
      >
        <div style={styles.brand}>
          FUTURE <span style={{ color: "#FFFFFF" }}>AKSHITHA</span>
          <div
            style={{
              fontSize: "10px",
              color: "#C2CEE0",
              letterSpacing: "2px",
              marginTop: "7px",
              fontWeight: 500,
            }}
          >
            LEARN · GROW · ACHIEVE
          </div>
        </div>

        <div
          style={{
            color: "#A7B6CF",
            fontSize: "11px",
            letterSpacing: "1.5px",
            padding: "0 12px 12px",
          }}
        >
          WORKSPACE
        </div>

        <nav aria-label="Dashboard pages">
          {links.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                style={{
                  ...styles.navLink,
                  background: active ? "#1A3156" : "transparent",
                  color: active ? "#F1D38E" : "#D7E0EF",
                  borderLeft: active
                    ? "3px solid #E7C77F"
                    : "3px solid transparent",
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "19px",
                    lineHeight: 1,
                    width: "22px",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1, minHeight: "30px" }} />

        <div
          style={{
            borderTop: "1px solid #263553",
            padding: "20px 10px 0",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "#C2CEE0",
            overflowWrap: "anywhere",
          }}
        >
          {user?.fullName || user?.name || user?.email || "Welcome"}
          <div style={{ color: "#F1D38E", marginTop: "5px" }}>
            {role.charAt(0).toUpperCase() + role.slice(1)} Account
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              minWidth: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobile ? menuOpen : true}
              aria-controls="dashboard-navigation"
              style={styles.menuButton}
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: isMobile ? "19px" : "22px",
                  lineHeight: 1.3,
                  margin: 0,
                  color: "#102447",
                  overflowWrap: "anywhere",
                }}
              >
                {title || "Dashboard"}
              </h1>
              {subtitle && (
                <p
                  style={{
                    color: "#596A85",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    margin: "6px 0 0",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button type="button" onClick={handleLogout} style={styles.logout}>
            Log out
          </button>
        </header>

        <section style={styles.content}>{children}</section>
      </main>
    </div>
  );
}
