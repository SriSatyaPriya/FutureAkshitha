import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  GraduationCap,
  Headphones,
  LockKeyhole,
  PlayCircle,
  Target,
  Trophy,
  Video,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { getCurrentUser } from "../services/demoStore";

const months = [
  {
    month: 1,
    title: "Orientation & Basics",
    description: "Build a strong foundation for your learning journey.",
    activities: [
      "Attend the batch orientation",
      "Set learning goals",
      "Study core fundamentals",
      "Complete introductory exercises",
    ],
  },
  {
    month: 2,
    title: "Core Concepts",
    description: "Understand important concepts through structured learning.",
    activities: [
      "Attend live classes",
      "Review recorded sessions",
      "Practise concept-based questions",
      "Submit weekly assignments",
    ],
  },
  {
    month: 3,
    title: "Practice & Feedback",
    description: "Strengthen your knowledge with regular practice.",
    activities: [
      "Complete hands-on exercises",
      "Attempt weekly practice tests",
      "Review your test results",
      "Apply mentor feedback",
    ],
  },
  {
    month: 4,
    title: "Applied Skills",
    description: "Use your knowledge to solve practical problems.",
    activities: [
      "Build a mini-project",
      "Work on a case study",
      "Practise real-world scenarios",
      "Submit your project for review",
    ],
  },
  {
    month: 5,
    title: "Mock Tests & Review",
    description: "Prepare for assessments and interviews.",
    activities: [
      "Attempt a mock test",
      "Participate in a mock interview",
      "Revise difficult concepts",
      "Review your learning gaps",
    ],
  },
  {
    month: 6,
    title: "Final Assessment",
    description: "Demonstrate your learning and complete the programme.",
    activities: [
      "Complete the final assessment",
      "Review your results",
      "Complete pending learning activities",
      "Check certificate eligibility",
    ],
  },
];

const supportItems = [
  {
    icon: Video,
    title: "Live classes",
    description: "Attend sessions according to your batch schedule.",
  },
  {
    icon: PlayCircle,
    title: "Recorded sessions",
    description: "Revisit available lessons whenever you need revision.",
  },
  {
    icon: BookOpen,
    title: "Study materials",
    description: "Use notes, guides and practice sets for learning.",
  },
  {
    icon: Headphones,
    title: "Doubt support",
    description: "Get help from mentors and faculty where available.",
  },
  {
    icon: FileText,
    title: "Tests & assignments",
    description: "Practise regularly and track your completed activities.",
  },
  {
    icon: Trophy,
    title: "Completion certificate",
    description: "Check your eligibility after the final assessment.",
  },
];

export default function LearningJourney() {
  const user = getCurrentUser();
  const userId = user?.id || "guest";

  const [progress, setProgress] = useState({});
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user || String(user.role).toLowerCase() !== "student") {
      setProgress({});
      return undefined;
    }
    let cancelled = false;

    apiRequest("/api/learning/my")
      .then((data) => {
        if (cancelled) return;
        const saved = {};
        (data.progress || []).forEach((item) => {
          saved[item.key] = true;
        });
        setProgress(saved);
        setLoadError("");
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message || "Unable to load your saved progress.");
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const totalActivities = months.reduce(
    (total, item) => total + item.activities.length,
    0
  );

  const completedActivities = months.reduce(
    (total, item) =>
      total +
      item.activities.filter(
        (_, index) => progress[`${item.month}-${index}`] === true
      ).length,
    0
  );

  const progressPercent = totalActivities
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  const completedMonths = months.filter((item) =>
    item.activities.every(
      (_, index) => progress[`${item.month}-${index}`] === true
    )
  ).length;

  const nextActivity = months
    .flatMap((item) =>
      item.activities.map((activity, index) => ({
        month: item.month,
        monthTitle: item.title,
        activity,
        index,
        key: `${item.month}-${index}`,
      }))
    )
    .find((item) => progress[item.key] !== true);

  async function toggleActivity(monthNumber, activityIndex) {
    const activityKey = `${monthNumber}-${activityIndex}`;
    const nextValue = !progress[activityKey];
    const updatedProgress = {
      ...progress,
      [activityKey]: nextValue,
    };

    setProgress(updatedProgress);
    setNoticeType("info");
    setNotice(nextValue ? "Saving your progress..." : "Updating your checklist...");

    try {
      await apiRequest("/api/learning/activity", {
        method: "PUT",
        body: JSON.stringify({ key: activityKey, complete: nextValue }),
      });
      setNoticeType("success");
      setNotice(nextValue
        ? "Your learning progress has been saved."
        : "Activity marked as pending.");
    } catch (err) {
      const rollback = { ...progress };
      delete rollback[activityKey];
      setProgress(rollback);
      setNoticeType("error");
      setNotice(err.message || "Progress could not be saved. Please try again.");
    }
  }

  async function resetProgress() {
    setNoticeType("info");
    setNotice("Resetting your checklist...");

    try {
      const data = await apiRequest("/api/learning/my", { method: "DELETE" });
      setProgress({});
      setNoticeType("success");
      setNotice(data.message || "Your learning checklist has been reset.");
    } catch (err) {
      setNoticeType("error");
      setNotice(err.message || "Progress could not be reset. Please try again.");
    }
  }

  return (
    <main className="learning-journey-page">
      <section className="lj-hero">
        <div className="lj-hero-content">
          <span className="lj-eyebrow">
            <GraduationCap size={16} />
            YOUR LEARNING JOURNEY
          </span>
          <h1>Six months to build your next chapter.</h1>
          <p>
            Follow your roadmap, complete activities, and prepare for your
            final assessment.
          </p>
        </div>
      </section>

      <section className="lj-progress-panel">
        <div className="lj-progress-top">
          <div>
            <span className="lj-section-kicker">YOUR OVERVIEW</span>
            <h2>Learning progress</h2>
          </div>
          <div className="lj-progress-number">
            <strong>{progressPercent}%</strong>
            <span>completed</span>
          </div>
        </div>
        <div
          className="lj-progress-track"
          role="progressbar"
          aria-label="Overall learning progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="lj-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="lj-progress-stats">
          <div><CheckCircle2 size={18} /><span><strong>{completedActivities}</strong> of {totalActivities} activities</span></div>
          <div><Trophy size={18} /><span><strong>{completedMonths}</strong> of 6 months completed</span></div>
          <button type="button" className="lj-reset-button" onClick={resetProgress}>
            <RotateCcw size={15} />Reset progress
          </button>
        </div>
        {loadError && loadError !== "Not authorized" && (
          <p className="lj-notice" role="alert">
            {loadError} Please sign in as a student to sync progress to your account.
          </p>
        )}
        {notice && (
          <p className="lj-notice" role={noticeType === "error" ? "alert" : "status"}>
            {notice}
          </p>
        )}
      </section>

      {nextActivity && (
        <section className="lj-next-activity">
          <div className="lj-next-activity-icon"><Target size={22} /></div>
          <div>
            <span className="lj-section-kicker">YOUR NEXT STEP</span>
            <h2>{nextActivity.activity}</h2>
            <p>Month {nextActivity.month}: {nextActivity.monthTitle}</p>
          </div>
          <button
            type="button"
            className="lj-next-button"
            onClick={() => {
              document.getElementById(`lj-month-${nextActivity.month}`)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            View activity <ArrowRight size={16} />
          </button>
        </section>
      )}

      <section className="lj-roadmap-section">
        <div className="lj-section-heading">
          <div>
            <span className="lj-section-kicker">THE ROADMAP</span>
            <h2>Your six-month programme</h2>
          </div>
          <span className="lj-duration-pill"><Clock size={15} />6 stages</span>
        </div>

        <div className="lj-month-grid">
          {months.map((item) => {
            const completedCount = item.activities.filter(
              (_, index) => progress[`${item.month}-${index}`] === true
            ).length;
            const isComplete = completedCount === item.activities.length;

            return (
              <article
                className={`lj-month-card ${isComplete ? "is-complete" : ""}`}
                id={`lj-month-${item.month}`}
                key={item.month}
              >
                <div className="lj-month-card-top">
                  <span className="lj-month-number">{String(item.month).padStart(2, "0")}</span>
                  {isComplete ? <CheckCircle2 size={21} /> : <span className="lj-month-status">Month {item.month}</span>}
                </div>
                <h3>{item.title}</h3>
                <p className="lj-month-description">{item.description}</p>
                <div className="lj-activity-list">
                  {item.activities.map((activity, index) => {
                    const activityKey = `${item.month}-${index}`;
                    const checked = progress[activityKey] === true;

                    return (
                      <label className={`lj-activity ${checked ? "is-checked" : ""}`} key={activityKey}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleActivity(item.month, index)}
                        />
                        {checked ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                        <span>{activity}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lj-support-section">
        <div className="lj-section-heading">
          <div>
            <span className="lj-section-kicker">SUPPORT THROUGHOUT</span>
            <h2>Everything you need to keep learning</h2>
          </div>
        </div>
        <div className="lj-support-grid">
          {supportItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="lj-support-card" key={item.title}>
                <div className="lj-support-icon"><Icon size={22} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lj-certificate-panel">
        <div className="lj-certificate-icon"><Trophy size={30} /></div>
        <div className="lj-certificate-copy">
          <span className="lj-section-kicker">YOUR MILESTONE</span>
          <h2>Work towards your completion certificate</h2>
          <p>
            Complete the activities and final assessment to unlock your
            completion certificate.
          </p>
        </div>
        <div className="lj-certificate-status">
          {progressPercent === 100 ? (
            <><CheckCircle2 size={19} />Checklist complete</>
          ) : (
            <><LockKeyhole size={18} />In progress</>
          )}
          <span>{progressPercent}%</span>
        </div>
      </section>
    </main>
  );
}
