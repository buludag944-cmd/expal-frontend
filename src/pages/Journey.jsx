import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input, { Label } from "../components/ui/Input";
import LifeAbroadRing from "../components/dashboard/LifeAbroadRing";
import {
  fetchTimeline,
  completeTask,
  fetchResidency,
  logAbsence,
  fetchScore,
  fetchVisaGuide,
  updateIrpApplication,
} from "../lib/journeyApi";
import { getApiBaseUrl } from "../apiConfig";
import { isNativeApp } from "../lib/platform";
import MobileVisaTracker from "./mobile/MobileVisaTracker";

const TABS = ["Visa guide", "Timeline", "Residency", "Documents", "Career"];

const PHASE_LABELS = {
  "pre-arrival": "Before you travel",
  "first-month": "First month in Ireland",
  "first-year": "First year",
  ongoing: "Ongoing",
};

function formatMoney(amount, currency = "EUR") {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount?.toLocaleString?.() ?? amount}`;
  }
}

function SalaryBenchmarkCard({ salary, profession, city }) {
  if (!salary?.median) return null;
  const { min, median, max, currency = "EUR" } = salary;
  const range = max - min || 1;
  const medianPct = Math.round(((median - min) / range) * 100);
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Salary benchmark</p>
        <p className="text-sm text-muted">
          {profession || "Your role"} in {city || "your city"}
        </p>
        <p className="text-2xl font-bold">{formatMoney(median, currency)}</p>
        <p className="text-sm text-muted">Typical median annual salary</p>
        <div className="relative h-2 rounded-full bg-surface overflow-hidden">
          <div className="absolute inset-y-0 left-0 right-0 bg-primary/20 rounded-full" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-white shadow"
            style={{ left: `calc(${medianPct}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>Low {formatMoney(min, currency)}</span>
          <span>High {formatMoney(max, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CredentialCard({ credential }) {
  if (!credential) return null;
  return (
    <Card>
      <CardContent className="pt-4 space-y-2 text-sm">
        <p className="font-semibold">
          Credential recognition{credential.status ? `: ${credential.status}` : ""}
        </p>
        {credential.steps?.length > 0 && (
          <ul className="list-disc pl-5 space-y-1 text-muted">
            {credential.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function IrpRenewalTracker({ residency, onSave, busy }) {
  const [applicationDate, setApplicationDate] = useState(
    residency?.record?.irpApplicationDate || ""
  );
  const irp = residency?.irpRenewal;

  useEffect(() => {
    setApplicationDate(residency?.record?.irpApplicationDate || "");
  }, [residency?.record?.irpApplicationDate]);

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">IRP renewal tracker</p>
        <p className="text-sm text-muted">
          IRP card processing often takes around <strong>14 weeks</strong>. Log when you applied to track days waiting and days remaining.
        </p>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ applicationDate, expectedWeeks: 14 });
          }}
        >
          <Label>IRP application date</Label>
          <Input
            type="date"
            value={applicationDate}
            onChange={(e) => setApplicationDate(e.target.value)}
            required
          />
          <Button type="submit" size="sm" loading={busy} disabled={busy || !applicationDate}>
            Save & track
          </Button>
        </form>
        {irp && (
          <div className="rounded-lg bg-surface p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Days waiting</span>
              <strong>{irp.daysWaiting}</strong>
            </div>
            <div className="flex justify-between">
              <span>Days remaining (est.)</span>
              <strong className={irp.isOverdue ? "text-red-600" : ""}>
                {irp.isOverdue ? "Past typical 14 weeks" : irp.daysRemaining}
              </strong>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>Expected by ~{irp.expectedDate}</span>
              <span>{irp.progressPercent}% of typical wait</span>
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div
                className={`h-full rounded-full ${irp.isOverdue ? "bg-red-500" : "bg-primary"}`}
                style={{ width: `${irp.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function findTaskForStep(stepTitle, tasks) {
  if (!stepTitle || !tasks?.length) return null;
  const words = stepTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  return (
    tasks.find((t) => {
      const title = t.title.toLowerCase();
      return words.some((w) => title.includes(w)) || title.includes(stepTitle.toLowerCase().slice(0, 12));
    }) || null
  );
}

function VisaGuideStep({ step, index, expanded, onToggle, task, onComplete, completing }) {
  const done = task?.isCompleted;
  return (
    <Card
      className={`transition-colors ${expanded ? "border-primary/50 ring-1 ring-primary/20" : "cursor-pointer active:bg-surface/80"}`}
    >
      <CardContent className="py-4">
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left flex gap-3 items-start min-h-[44px] touch-manipulation"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              done ? "bg-green-600 text-white" : "bg-primary text-white"
            }`}
          >
            {done ? "✓" : index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium pr-6">{step.title}</p>
            {!expanded && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{step.description}</p>
            )}
            {step.phase && !expanded && (
              <p className="text-xs text-primary mt-2">{PHASE_LABELS[step.phase] || step.phase}</p>
            )}
          </div>
          <span className="text-muted text-lg shrink-0" aria-hidden>
            {expanded ? "−" : "+"}
          </span>
        </button>
        {expanded && (
          <div className="mt-3 pl-11 space-y-3">
            <p className="text-sm text-muted">{step.description}</p>
            {step.phase && (
              <p className="text-xs text-primary">{PHASE_LABELS[step.phase] || step.phase}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {task && !done && (
                <Button size="sm" onClick={onComplete} loading={completing} disabled={completing}>
                  Mark complete
                </Button>
              )}
              {task && done && (
                <span className="text-xs font-semibold text-green-700 py-2">Added to timeline — done</span>
              )}
              {!task && (
                <span className="text-xs text-muted py-2">Tip: check Timeline for related tasks</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Journey() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("Visa guide");
  const [tasks, setTasks] = useState([]);
  const [visaGuide, setVisaGuide] = useState(null);
  const [guideError, setGuideError] = useState("");
  const [residency, setResidency] = useState(null);
  const [score, setScore] = useState(null);
  const [credential, setCredential] = useState(null);
  const [salary, setSalary] = useState(null);
  const [absenceForm, setAbsenceForm] = useState({ fromDate: "", toDate: "", reason: "" });
  const [taskError, setTaskError] = useState("");
  const [taskBusyId, setTaskBusyId] = useState(null);
  const [irpBusy, setIrpBusy] = useState(false);
  const [careerBusy, setCareerBusy] = useState("");
  const [expandedStep, setExpandedStep] = useState(null);
  const [stepBusy, setStepBusy] = useState(null);

  const API = getApiBaseUrl();

  const loadResidency = () => fetchResidency(token).then(setResidency);

  useEffect(() => {
    if (!token) return;
    if (tab === "Visa guide") {
      setGuideError("");
      fetchVisaGuide(token)
        .then(setVisaGuide)
        .catch((e) => {
          setVisaGuide(null);
          setGuideError(e.message);
        });
      fetchTimeline(token).then(setTasks).catch(() => setTasks([]));
    }
    if (tab === "Timeline") fetchTimeline(token).then(setTasks);
    if (tab === "Residency") loadResidency();
    if (tab === "Career" || tab === "Timeline") fetchScore(token).then(setScore);
  }, [token, tab, user?.employmentStatus]);

  const toggle = async (task) => {
    if (taskBusyId) return;
    setTaskError("");
    setTaskBusyId(task.id);
    try {
      await completeTask(token, task.id, !task.isCompleted);
      setTasks(await fetchTimeline(token));
    } catch (e) {
      setTaskError(e.message || "Could not update task");
    } finally {
      setTaskBusyId(null);
    }
  };

  const submitAbsence = async (e) => {
    e.preventDefault();
    await logAbsence(token, absenceForm);
    await loadResidency();
    setAbsenceForm({ fromDate: "", toDate: "", reason: "" });
  };

  const saveIrp = async (payload) => {
    setIrpBusy(true);
    try {
      const data = await updateIrpApplication(token, payload);
      setResidency((prev) => ({ ...prev, record: data.record, irpRenewal: data.irpRenewal }));
    } finally {
      setIrpBusy(false);
    }
  };

  const runCredential = async () => {
    setCareerBusy("credential");
    try {
      const res = await fetch(
        `${API}/api/journey/career/credential?category=${encodeURIComponent(user.professionCategory || "Tech")}&country=${encodeURIComponent(user.destinationCountry || "Ireland")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCredential(await res.json());
    } finally {
      setCareerBusy("");
    }
  };

  const completeStepTask = async (task) => {
    if (!task || stepBusy) return;
    setStepBusy(task.id);
    try {
      await completeTask(token, task.id, true);
      setTasks(await fetchTimeline(token));
    } finally {
      setStepBusy(null);
    }
  };

  const runSalary = async () => {
    setCareerBusy("salary");
    try {
      const res = await fetch(
        `${API}/api/journey/career/salary?profession=${encodeURIComponent(user.profession || "Software Engineer")}&city=${encodeURIComponent(user.destinationCity || "Dublin")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSalary(await res.json());
    } finally {
      setCareerBusy("");
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const phase = user?.phase;
  const showResidency = ["integration", "establishment", "longterm"].includes(phase);
  const showIrpTracker = (user?.destinationCountry || "Ireland") === "Ireland";
  const native = isNativeApp();

  if (native) {
    return <MobileVisaTracker />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="page-title">Journey</h1>
        {user?.visaType && (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/15 text-primary">
            {user.visaType}
          </span>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg min-h-[44px] ${
              tab === t ? "bg-surface text-foreground" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Visa guide" && (
        <div className="space-y-4">
          {guideError && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted">{guideError}</p>
                <Link to="/profile">
                  <Button size="sm">Set visa type in Profile</Button>
                </Link>
              </CardContent>
            </Card>
          )}
          {visaGuide && (
            <>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {visaGuide.shortLabel || visaGuide.visaType}
                  </p>
                  <h2 className="text-lg font-semibold">{visaGuide.tagline}</h2>
                  {visaGuide.officialUrl && (
                    <a
                      href={visaGuide.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Official government source →
                    </a>
                  )}
                </CardContent>
              </Card>

              {visaGuide.employmentGuidance &&
                user?.employmentStatus &&
                user.employmentStatus !== "employed" && (
                  <Card className="border-amber-500/40 bg-amber-50/50">
                    <CardContent className="pt-4 space-y-2">
                      <p className="font-semibold text-sm">{visaGuide.employmentGuidance.title}</p>
                      <p className="text-sm text-muted">{visaGuide.employmentGuidance.summary}</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted">
                        {(visaGuide.employmentGuidance.tips || []).map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link to="/employment-support">
                          <Button size="sm" variant="secondary">Open employment support</Button>
                        </Link>
                        <Link to="/profile" className="text-xs text-primary hover:underline py-2">
                          Update employment status in Profile →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {visaGuide.irpRenewalGuide && (
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-semibold text-sm">{visaGuide.irpRenewalGuide.title}</p>
                    <p className="text-sm text-muted">{visaGuide.irpRenewalGuide.summary}</p>
                    <Button size="sm" variant="secondary" onClick={() => setTab("Residency")}>
                      Track IRP application →
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Your step-by-step path</h3>
                <p className="text-xs text-muted">Tap a step to expand details and mark it complete.</p>
                {(visaGuide.steps || []).map((step, i) => {
                  const task = findTaskForStep(step.title, tasks);
                  return (
                    <VisaGuideStep
                      key={`${step.title}-${i}`}
                      step={step}
                      index={i}
                      expanded={expandedStep === i}
                      onToggle={() => setExpandedStep((prev) => (prev === i ? null : i))}
                      task={task}
                      completing={stepBusy === task?.id}
                      onComplete={() => completeStepTask(task)}
                    />
                  );
                })}
              </div>

              {visaGuide.tips?.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-sm mb-2">Tips</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted">
                      {visaGuide.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted">
                Wrong pathway?{" "}
                <Link to="/profile" className="text-primary hover:underline">
                  Change visa type in Profile
                </Link>{" "}
                — your timeline updates automatically.
              </p>
            </>
          )}
          {!visaGuide && !guideError && <p className="text-muted text-sm">Loading your visa guide…</p>}
        </div>
      )}

      {tab === "Timeline" && (
        <div className="space-y-2">
          {taskError && <p className="text-sm text-red-600">{taskError}</p>}
          {tasks.length === 0 && (
            <p className="text-sm text-muted">No tasks yet — complete onboarding or set your visa type in Profile.</p>
          )}
          {tasks.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && !task.isCompleted;
            const busy = taskBusyId === task.id;
            return (
              <Card key={task.id} className={overdue ? "border-red-500/40" : ""}>
                <CardContent className="py-4">
                  <div className="flex justify-between gap-2 items-start">
                    <div className="flex-1">
                      {task.phase === "relocation" && !task.isCompleted && (
                        <p className="text-[10px] font-semibold uppercase text-primary mb-1">Relocation check-in</p>
                      )}
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted mt-1">{task.description}</p>
                      {task.dueDate && <p className="text-xs mt-1 text-muted">Due {task.dueDate}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant={task.isCompleted ? "ghost" : "primary"}
                      onClick={() => toggle(task)}
                      loading={busy}
                      disabled={busy}
                      className="min-h-[44px] shrink-0"
                    >
                      {task.isCompleted ? "Undo" : "Complete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "Residency" && (
        <div className="space-y-4">
          {showIrpTracker && (
            <IrpRenewalTracker residency={residency} onSave={saveIrp} busy={irpBusy} />
          )}
          {!showResidency ? (
            <p className="text-muted text-sm">
              Long-term residency counters unlock in the Integration phase (3+ months after arrival). IRP tracking is available above.
            </p>
          ) : residency ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-5 space-y-2">
                  <p><strong>Days present:</strong> {residency.record?.daysPresentInCountry ?? 0}</p>
                  <p><strong>PR eligible from:</strong> {residency.prEligibleDate || residency.record?.prEligibilityDate || "—"}</p>
                  <p><strong>Citizenship eligible from:</strong> {residency.citizenshipEligibleDate || residency.record?.citizenshipEligibilityDate || "—"}</p>
                </CardContent>
              </Card>
              <form onSubmit={submitAbsence} className="space-y-2">
                <Label>Log absence</Label>
                <Input type="date" value={absenceForm.fromDate} onChange={(e) => setAbsenceForm({ ...absenceForm, fromDate: e.target.value })} required />
                <Input type="date" value={absenceForm.toDate} onChange={(e) => setAbsenceForm({ ...absenceForm, toDate: e.target.value })} required />
                <Input placeholder="Reason" value={absenceForm.reason} onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })} />
                <Button type="submit">Save absence</Button>
              </form>
            </div>
          ) : (
            <p className="text-muted">Loading residency…</p>
          )}
        </div>
      )}

      {tab === "Documents" && <p className="text-muted">Document vault — upload coming soon.</p>}

      {tab === "Career" && (
        <div className="space-y-4">
          {score && <LifeAbroadRing score={score.totalScore} />}
          <Button onClick={runCredential} loading={careerBusy === "credential"} disabled={!!careerBusy}>
            Check credential recognition
          </Button>
          <CredentialCard credential={credential} />
          <Button onClick={runSalary} loading={careerBusy === "salary"} disabled={!!careerBusy}>
            Salary benchmark
          </Button>
          <SalaryBenchmarkCard
            salary={salary}
            profession={user?.profession}
            city={user?.destinationCity}
          />
        </div>
      )}
    </div>
  );
}
