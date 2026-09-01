import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import {
  fetchTimeline,
  fetchDocuments,
  addDocument,
  deleteDocument,
  completeTask,
} from "../../lib/journeyApi";
import {
  MobileScreen,
  MobileSectionTitle,
  MobileCard,
  MobileCallout,
  MobilePostSheet,
} from "../../components/mobile/MobileShared";
import { useLocalTabSwipe } from "../../hooks/useSwipeNav";

const TABS = ["tracker", "guide", "docs"];
const DOC_TYPES = ["Employment Permit", "IRP Card", "PPS Number", "Passport", "Bank Letter", "Other"];

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

function docEmoji(type = "") {
  const t = type.toLowerCase();
  if (t.includes("irp")) return "🪪";
  if (t.includes("pps")) return "📋";
  if (t.includes("bank")) return "🏦";
  if (t.includes("passport")) return "🛂";
  if (t.includes("permit")) return "📄";
  return "📁";
}

export default function MobileVisaTracker() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState("tracker");
  const [taskBusyId, setTaskBusyId] = useState(null);
  const [taskError, setTaskError] = useState("");
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: "", documentType: "IRP Card", expiryDate: "", fileUrl: "" });
  const [docError, setDocError] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const { onTouchStart, onTouchMove, onTouchEnd } = useLocalTabSwipe(TABS, tab, setTab);

  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [t, d] = await Promise.all([
        fetchTimeline(token),
        fetchDocuments(token).catch(() => []),
      ]);
      setTasks(t);
      setDocuments(d);
    } catch {
      setTasks([]);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const toggleTask = async (task) => {
    if (!token || taskBusyId) return;
    setTaskError("");
    setTaskBusyId(task.id);
    try {
      await completeTask(token, task.id, !task.isCompleted);
      setTasks(await fetchTimeline(token));
    } catch (err) {
      setTaskError(err.message || "Could not update step");
    } finally {
      setTaskBusyId(null);
    }
  };

  const submitDocument = async (e) => {
    e.preventDefault();
    if (!token) return;
    setDocError("");
    setDocBusy(true);
    try {
      await addDocument(token, {
        name: docForm.name.trim(),
        documentType: docForm.documentType,
        expiryDate: docForm.expiryDate || null,
        fileUrl: docForm.fileUrl.trim() || null,
      });
      setDocuments(await fetchDocuments(token));
      setDocForm({ name: "", documentType: "IRP Card", expiryDate: "", fileUrl: "" });
      setShowDocForm(false);
    } catch (err) {
      setDocError(err.message || "Could not save document");
    } finally {
      setDocBusy(false);
    }
  };

  const removeDocument = async (id) => {
    if (!token || !window.confirm("Remove this document from your vault?")) return;
    try {
      await deleteDocument(token, id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setDocError(err.message || "Could not delete");
    }
  };

  const daysIn = daysSince(user?.arrivalDate);
  const daysForPr = 1825;
  const progress = Math.min(1, daysIn / daysForPr);
  const today = new Date().toISOString().slice(0, 10);
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  const deadlines = tasks
    .filter((t) => t.dueDate && !t.isCompleted)
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      dot: t.dueDate < today ? "#E24B4A" : "#EF9F27",
      title: t.title,
      desc: t.description || "Relocation task",
      date: t.dueDate,
      urgent: t.dueDate < today,
    }));

  return (
    <MobileScreen
      title={tab === "tracker" ? "Visa & permit tracker" : tab === "guide" ? "Relocation checklist" : "Document vault"}
      action={
        tab === "docs" ? (
          <button
            type="button"
            className="mob-back-btn"
            style={{ background: "none", fontSize: 22 }}
            onClick={() => setShowDocForm(true)}
            aria-label="Add document"
          >
            ＋
          </button>
        ) : (
          <span className="mob-back-btn--placeholder w-8" />
        )
      }
      chromeExtra={
        <div
          className="mob-tab-row"
          data-no-route-swipe
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`mob-tab-btn${tab === t ? " mob-tab-btn--on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "tracker" ? "Tracker" : t === "guide" ? "Checklist" : "Vault"}
            </button>
          ))}
        </div>
      }
    >
      {taskError && (
        <p style={{ color: "#a32d2d", fontSize: 12, margin: "0 0 12px" }}>{taskError}</p>
      )}

      {tab === "tracker" && (
        <>
          <div className="mob-visa-header">
            <p className="mob-visa-label">Your permit</p>
            <p className="mob-visa-type">{user?.visaType || "Complete onboarding to set visa type"}</p>
            <div className="mob-progress-bg">
              <div className="mob-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mob-progress-row">
              <span>{user?.arrivalDate ? new Date(user.arrivalDate).toLocaleDateString("en-IE", { month: "short", year: "numeric" }) : "Start"}</span>
              <span className="mob-progress-center">{Math.round(progress * 100)}% to PR</span>
              <span>Target</span>
            </div>
          </div>

          <div className="mob-stats-grid">
            <div className="mob-stat-box">
              <div className="mob-stat-label">Days in Ireland</div>
              <div className="mob-stat-val">{daysIn.toLocaleString()}</div>
              <div className="mob-stat-sub">Since arrival</div>
            </div>
            <div className="mob-stat-box">
              <div className="mob-stat-label">Days to PR</div>
              <div className="mob-stat-val">{(daysForPr - daysIn).toLocaleString()}</div>
              <div className="mob-stat-sub">5-year route</div>
            </div>
            <div className="mob-stat-box">
              <div className="mob-stat-label">Open tasks</div>
              <div className="mob-stat-val">{tasks.filter((t) => !t.isCompleted).length}</div>
              <div className="mob-stat-sub">On checklist</div>
            </div>
            <div className="mob-stat-box">
              <div className="mob-stat-label">Completed</div>
              <div className="mob-stat-val">{completedCount}</div>
              <div className="mob-stat-sub">Steps done</div>
            </div>
          </div>

          <MobileSectionTitle>Key deadlines</MobileSectionTitle>
          <MobileCard style={{ padding: 0 }}>
            {deadlines.length === 0 && (
              <p style={{ padding: 12, fontSize: 12, color: "var(--mob-text-muted)", margin: 0 }}>
                No upcoming deadlines — check the Checklist tab.
              </p>
            )}
            {deadlines.map((d) => (
              <div key={d.id} className="mob-deadline-item">
                <div className="mob-deadline-dot" style={{ background: d.dot }} />
                <div style={{ flex: 1 }}>
                  <p className="mob-ref-name" style={{ fontSize: 12 }}>{d.title}</p>
                  <p className="mob-ref-role">{d.desc}</p>
                </div>
                <span className={`mob-badge${d.urgent ? " mob-badge--red" : " mob-badge--amber"}`}>{d.date}</span>
              </div>
            ))}
          </MobileCard>

          <MobileCallout color="purple">
            Tap <strong>Checklist</strong> to mark each visa step done. You&apos;ll get alerts in Notifications for overdue and upcoming steps.
          </MobileCallout>

          <MobileCallout color="amber">
            EU citizens: no work permit required. Non-EU: notify DETE promptly if you lose your job on a CSEP.
          </MobileCallout>
        </>
      )}

      {tab === "guide" && (
        <>
          <p style={{ fontSize: 12, color: "var(--mob-pink)", fontWeight: 600, margin: "0 0 12px" }}>
            {user?.destinationCountry || "Ireland"} · {user?.visaType || "Set visa type in onboarding"}
          </p>
          <div className="mob-progress-card">
            <div>
              <p style={{ fontSize: 10, textTransform: "uppercase", opacity: 0.8, margin: "0 0 4px" }}>Your progress</p>
              <strong>{completedCount} / {tasks.length || 0}</strong>
              <p style={{ fontSize: 12, opacity: 0.9, margin: "4px 0 0" }}>steps completed</p>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
              {tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </div>
          </div>

          <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
            Each step is an activity to complete after arrival. Tap <strong>Mark done</strong> when finished — we&apos;ll remind you about the next step via notifications.
          </p>

          {tasks.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && !task.isCompleted;
            const dueSoon = task.dueDate && !task.isCompleted && task.dueDate >= today;
            const status = task.isCompleted ? "done" : overdue ? "progress" : dueSoon ? "progress" : "upcoming";
            const icon = task.isCompleted ? "✓" : overdue ? "!" : dueSoon ? "↻" : "⏳";
            return (
              <div key={task.id} className={`mob-step-card${task.isCompleted ? " done" : ""}`}>
                <div className="mob-step-card-inner">
                  <div className="mob-step-icon" style={{ background: task.isCompleted ? "#dcfce7" : overdue ? "#fee2e2" : "#f3f4f6" }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="mob-step-title">{task.title}</div>
                    {task.category && (
                      <p style={{ fontSize: 10, color: "var(--mob-text-muted)", margin: "2px 0 0" }}>{task.category}</p>
                    )}
                  </div>
                  <span className={`mob-step-badge ${status}`}>
                    {task.isCompleted ? "Done" : overdue ? "Overdue" : task.dueDate ? `Due ${task.dueDate}` : "Open"}
                  </span>
                </div>
                {task.description && <p className="mob-step-desc">{task.description}</p>}
                <div className="mob-step-meta">
                  <button
                    type="button"
                    className={`mob-step-action${task.isCompleted ? " mob-step-action--done" : ""}`}
                    disabled={taskBusyId === task.id}
                    onClick={() => toggleTask(task)}
                  >
                    {taskBusyId === task.id ? "Saving…" : task.isCompleted ? "Undo" : "Mark done"}
                  </button>
                </div>
              </div>
            );
          })}

          {tasks.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--mob-text-muted)" }}>
              <Link to="/onboarding">Complete onboarding</Link> to generate your checklist.
            </p>
          )}
        </>
      )}

      {tab === "docs" && (
        <>
          <p style={{ fontSize: 12, color: "var(--mob-text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
            Store permit, IRP, PPS, and other key documents. Add expiry dates so we can remind you before they lapse.
          </p>

          {docError && <p style={{ color: "#a32d2d", fontSize: 12, margin: "0 0 8px" }}>{docError}</p>}

          <MobileCard style={{ padding: 0 }}>
            {documents.length === 0 && (
              <p style={{ padding: 12, fontSize: 12, color: "var(--mob-text-muted)", margin: 0 }}>
                No documents yet — tap ＋ to add your first.
              </p>
            )}
            {documents.map((d) => (
              <div key={d.id} className="mob-doc-item">
                <span style={{ fontSize: 20 }}>{docEmoji(d.documentType || d.name)}</span>
                <div style={{ flex: 1 }}>
                  <p className="mob-ref-name" style={{ fontSize: 12 }}>{d.name}</p>
                  <p className="mob-ref-role">
                    {[d.documentType, d.expiryDate ? `Expires ${d.expiryDate}` : null].filter(Boolean).join(" · ") || "No expiry set"}
                  </p>
                  {d.fileUrl && (
                    <p style={{ fontSize: 11, color: "var(--mob-text-muted)", margin: "4px 0 0" }}>{d.fileUrl}</p>
                  )}
                </div>
                <button type="button" className="mob-btn-secondary" style={{ minHeight: 32, fontSize: 11 }} onClick={() => removeDocument(d.id)}>
                  Remove
                </button>
              </div>
            ))}
          </MobileCard>

          <button type="button" className="mob-btn-primary mob-doc-add-row" style={{ width: "100%", minHeight: 44, marginTop: 12 }} onClick={() => setShowDocForm(true)}>
            ＋ Add document
          </button>
        </>
      )}

      <MobilePostSheet open={showDocForm} onClose={() => setShowDocForm(false)} title="Add to document vault">
        <form onSubmit={submitDocument} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            className="mob-search-input"
            placeholder="Document name (e.g. IRP Card 2026)"
            value={docForm.name}
            onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
            required
          />
          <select
            className="mob-search-input"
            value={docForm.documentType}
            onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className="mob-search-input"
            type="date"
            value={docForm.expiryDate}
            onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
            aria-label="Expiry date"
          />
          <input
            className="mob-search-input"
            placeholder="Notes or reference number (optional)"
            value={docForm.fileUrl}
            onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
          />
          {docError && <p style={{ color: "#a32d2d", fontSize: 12, margin: 0 }}>{docError}</p>}
          <button type="submit" className="mob-btn-primary" style={{ height: 44 }} disabled={docBusy}>
            {docBusy ? "Saving…" : "Save document"}
          </button>
        </form>
      </MobilePostSheet>
    </MobileScreen>
  );
}
