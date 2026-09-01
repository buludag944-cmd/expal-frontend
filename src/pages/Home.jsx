import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Button from "../components/ui/Button";
import PhaseTag from "../components/shared/PhaseTag";
import LifeAbroadRing from "../components/dashboard/LifeAbroadRing";
import { fetchDashboard, completeTask, findMentor } from "../lib/journeyApi";
import { isNativeApp } from "../lib/platform";
import MobileHome from "./mobile/MobileHome";

export default function Home() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskBusyId, setTaskBusyId] = useState(null);
  const [mentorBusy, setMentorBusy] = useState(false);

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetchDashboard(token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const toggleTask = async (task) => {
    if (taskBusyId) return;
    setTaskError("");
    setTaskBusyId(task.id);
    try {
      await completeTask(token, task.id, !task.isCompleted);
      load();
    } catch (e) {
      setTaskError(e.message || "Could not update task");
    } finally {
      setTaskBusyId(null);
    }
  };

  const retryMentor = async () => {
    setMentorBusy(true);
    try {
      await findMentor(token);
      load();
    } catch {
      /* dashboard reload still useful */
      load();
    } finally {
      setMentorBusy(false);
    }
  };

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "there"
    : "there";

  if (isNativeApp()) {
    return <MobileHome />;
  }

  if (user && !user.onboardingComplete) {
    return (
      <div className="expal-feed max-w-lg">
        <p className="t-label">Welcome</p>
        <h1 className="t-h1 mt-1">Let&apos;s set up your move</h1>
        <p className="t-body mt-2 mb-4">We&apos;ll personalise timeline, mentor match, and forums for you.</p>
        <div className="expal-card">
          <Link to="/onboarding">
            <Button className="w-full justify-center">Get started →</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <p className="t-body">Loading your dashboard…</p>;
  if (error) return <p className="text-[rgb(var(--coral))]">{error}</p>;
  if (!data) return null;

  const { phase, urgentTasks, mentorMatch, lifeAbroadScore, showScore, phaseCard, contextualThread, user: u } = data;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="expal-feed max-w-lg mx-auto md:max-w-2xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="t-label">Good morning</p>
          <h1 className="t-h1 mt-0.5">{displayName} 👋</h1>
        </div>
        {showScore && lifeAbroadScore && <LifeAbroadRing score={lifeAbroadScore.totalScore} />}
      </div>

      {phaseCard && (
        <div className="expal-card expal-card-coral mb-1">
          <PhaseTag phase={phase} arrivalDate={u.arrivalDate} city={u.destinationCity} className="!bg-white/20 !text-white mb-2" />
          {phaseCard.type === "countdown" && (
            <p className="font-display text-base font-bold">{phaseCard.label}</p>
          )}
          {phaseCard.type === "months" && (
            <p className="font-display text-base font-bold">{phaseCard.label}</p>
          )}
          {phaseCard.type === "lifer" && (
            <p className="font-display text-base font-bold">{phaseCard.label}</p>
          )}
          {phaseCard.type === "pr" && (
            <>
              <p className="font-display text-base font-bold">{u.destinationCity || "Your city"}</p>
              <p className="text-xs text-white/75 mt-1 mb-2">Permanent residency progress</p>
              <div className="flex items-center gap-2">
                <div className="progress-track flex-1 !bg-white/25">
                  <div className="progress-fill !bg-white" style={{ width: `${phaseCard.percent}%` }} />
                </div>
                <span className="font-display text-xs font-bold">{phaseCard.percent}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {u?.visaType && (
        <div className="expal-card mb-4 border border-[rgb(var(--sky))]/30 bg-[rgb(var(--sky-pale))]/40">
          <p className="t-label text-[rgb(var(--sky-dark))]">Your visa pathway</p>
          <p className="font-display text-sm font-bold mt-1">{u.visaType}</p>
          <Link to="/journey" className="inline-block mt-2 text-xs font-semibold text-[rgb(var(--sky-dark))] hover:underline">
            Open step-by-step visa guide →
          </Link>
        </div>
      )}

      <div>
        <p className="font-display text-[13px] font-bold text-[rgb(var(--ink))] mb-2">Urgent tasks</p>
        <div className="expal-card !py-2 !px-3.5">
          {taskError && (
            <p className="text-xs text-[rgb(var(--coral))] py-2">{taskError}</p>
          )}
          {urgentTasks.length === 0 && (
            <p className="t-body py-2">No open tasks — you&apos;re on track!</p>
          )}
          {urgentTasks.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && !task.isCompleted;
            const done = task.isCompleted;
            const busy = taskBusyId === task.id;
            const isRelocation = task.phase === "relocation";
            return (
              <div
                key={task.id}
                className="task-item"
                role="button"
                tabIndex={0}
                onClick={() => !busy && toggleTask(task)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!busy) toggleTask(task);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!busy) toggleTask(task);
                  }}
                  disabled={busy}
                  className={`task-check ${done ? "done" : ""} ${overdue && !done ? "overdue" : ""}`}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {busy ? "…" : done ? "✓" : ""}
                </button>
                <div className="task-body flex-1 min-w-0">
                  {isRelocation && !done && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--sky-dark))]">
                      Relocation check-in
                    </span>
                  )}
                  <div className={`task-name ${done ? "done" : ""}`}>{task.title}</div>
                  {task.description && (
                    <div className="text-[11px] text-[rgb(var(--ink-soft))] mt-0.5 line-clamp-2">
                      {task.description}
                    </div>
                  )}
                  {task.dueDate && (
                    <div className={`task-due ${overdue && !done ? "overdue" : ""}`}>
                      {overdue && !done ? `Overdue · ${task.dueDate}` : `Due ${task.dueDate}`}
                    </div>
                  )}
                </div>
                {!done && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!busy) toggleTask(task);
                    }}
                    className="shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold bg-[rgb(var(--coral-pale))] text-[rgb(var(--coral-dark))] min-h-[44px] min-w-[44px]"
                  >
                    {busy ? "…" : "Complete"}
                  </button>
                )}
              </div>
            );
          })}
          <Link to="/journey" className="block text-center text-xs font-display font-semibold text-[rgb(var(--coral))] py-2">
            View all tasks →
          </Link>
        </div>
      </div>

      <div className="expal-card-sky-pale rounded-[14px] p-3 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full bg-[rgb(var(--sky-pale))] flex items-center justify-center font-display text-xs font-bold text-[rgb(var(--sky-dark))] shrink-0">
          {mentorMatch?.mentor
            ? `${mentorMatch.mentor.firstName?.[0] || ""}${mentorMatch.mentor.lastName?.[0] || ""}`
            : "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xs font-bold text-[rgb(var(--sky-dark))]">
            {mentorMatch?.mentor
              ? `${mentorMatch.mentor.firstName} ${mentorMatch.mentor.lastName} — your mentor`
              : "Finding your mentor…"}
          </p>
          <p className="text-[11px] text-[rgb(var(--sky-dark))] opacity-80">
            {mentorMatch?.mentor?.profession || "Matched by city & profession"}
          </p>
        </div>
        {mentorMatch?.mentor ? (
          <Link to={`/messages?user=${mentorMatch.mentor.id}`}>
            <button type="button" className="btn-sky-expal min-h-[44px] px-4">Message</button>
          </Link>
        ) : (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              className="btn-sky-expal min-h-[44px] px-3 text-[11px]"
              onClick={retryMentor}
              disabled={mentorBusy}
            >
              {mentorBusy ? "Searching…" : "Find mentor"}
            </button>
            <Link
              to="/users"
              className="text-center text-[10px] font-semibold text-[rgb(var(--sky-dark))] underline min-h-[44px] flex items-center justify-center"
            >
              Browse members
            </Link>
          </div>
        )}
      </div>

      {contextualThread && (
        <div className="expal-card">
          <p className="t-label !text-[rgb(var(--ink-soft))] mb-1">From the community</p>
          <Link
            to={`/community?thread=${contextualThread.id}`}
            className="font-display text-sm font-semibold text-[rgb(var(--coral-dark))] hover:underline"
          >
            {contextualThread.title}
          </Link>
          <p className="t-body text-xs mt-1">💬 {contextualThread.replyCount || 0} replies</p>
        </div>
      )}
    </div>
  );
}
