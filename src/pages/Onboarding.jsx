import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { isNativeApp } from "../lib/platform";
import Button from "../components/ui/Button";
import Input, { Label } from "../components/ui/Input";
import { submitOnboarding, fetchVisaTypes } from "../lib/journeyApi";
import { MobileScreen } from "../components/mobile/MobileShared";
import "../styles/mobile-onboarding.css";

const DRAFT_KEY = "expal_onboarding_draft";

const COUNTRIES = ["Ireland", "Germany", "Netherlands", "United Kingdom", "France", "Spain", "Other"];
const CITIES = {
  Ireland: ["Dublin", "Cork", "Galway"],
  Germany: ["Berlin", "Munich", "Frankfurt"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague"],
  "United Kingdom": ["London", "Manchester", "Edinburgh"],
  default: ["Other"],
};
const CATEGORIES = ["Tech", "Healthcare", "Finance", "Legal", "Education", "Other"];
const EMPLOYMENT_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "job_seeking", label: "Looking for work" },
  { value: "unemployed", label: "Unemployed" },
  { value: "laid_off", label: "Redundant / laid off" },
];
const CONCERNS = ["bureaucracy", "housing", "career", "social", "family"];

const FALLBACK_VISA = {
  Ireland: [
    { value: "CSEP (Critical Skills Employment Permit)", label: "CSEP (Critical Skills Employment Permit)", tagline: "High-demand roles" },
    { value: "General Work Permit", label: "General Work Permit", tagline: "Employer-sponsored route" },
    { value: "EU Passport / EU Citizen", label: "EU / EEA / Swiss citizen", tagline: "No work permit required" },
  ],
  default: [
    { value: "Work Permit", label: "Work Permit", tagline: "" },
    { value: "EU Passport / EU Citizen", label: "EU / EEA / Swiss citizen", tagline: "Freedom of movement" },
    { value: "Other", label: "Other", tagline: "" },
  ],
};

const EU_VISA = "EU Passport / EU Citizen";

const STEP_IDS = ["welcome", "destination", "profession", "dates", "residency", "visa", "family", "concerns"];

function defaultForm(user) {
  return {
    destinationCountry: "",
    destinationCity: "",
    profession: "",
    professionCategory: "Tech",
    employmentStatus: "employed",
    residencyStatus: "",
    alreadyArrived: false,
    moveDate: "",
    arrivalDate: "",
    visaType: "",
    familyStatus: "single",
    concerns: [],
    homeCountry: user?.nationality || "",
  };
}

function readDraft(user) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { step: 0, form: defaultForm(user) };
    const parsed = JSON.parse(raw);
    return {
      step: Number(parsed.step) || 0,
      form: { ...defaultForm(user), ...parsed.form },
    };
  } catch {
    return { step: 0, form: defaultForm(user) };
  }
}

function writeDraft(step, form) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form }));
  } catch {
    /* ignore quota */
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function isEuCitizen(form) {
  return form.residencyStatus === "eu";
}

function visibleStepIds(form) {
  if (isEuCitizen(form)) {
    return STEP_IDS.filter((id) => id !== "visa");
  }
  return STEP_IDS;
}

export default function Onboarding() {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const native = isNativeApp();
  const initial = useMemo(() => readDraft(user), [user]);
  const [step, setStep] = useState(initial.step);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visaTypes, setVisaTypes] = useState([]);
  const [form, setForm] = useState(initial.form);

  const steps = visibleStepIds(form);
  const stepId = steps[Math.min(step, steps.length - 1)] || "welcome";
  const totalSteps = steps.length;

  useEffect(() => {
    writeDraft(step, form);
  }, [step, form]);

  useEffect(() => {
    if (!form.destinationCountry || !token) return;
    fetchVisaTypes(form.destinationCountry, token)
      .then((list) => {
        if (list.length) setVisaTypes(list);
        else setVisaTypes(FALLBACK_VISA[form.destinationCountry] || FALLBACK_VISA.default);
      })
      .catch(() => {
        setVisaTypes(FALLBACK_VISA[form.destinationCountry] || FALLBACK_VISA.default);
      });
  }, [form.destinationCountry, token]);

  useEffect(() => {
    if (form.residencyStatus === "eu" && form.visaType !== EU_VISA) {
      setForm((f) => ({ ...f, visaType: EU_VISA }));
    }
  }, [form.residencyStatus, form.visaType]);

  const cities = CITIES[form.destinationCountry] || CITIES.default;

  const toggleConcern = (c) => {
    setForm((f) => ({
      ...f,
      concerns: f.concerns.includes(c) ? f.concerns.filter((x) => x !== c) : [...f.concerns, c],
    }));
  };

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));

  const canContinue = () => {
    switch (stepId) {
      case "destination":
        return !!form.destinationCountry && !!form.destinationCity;
      case "profession":
        return !!form.profession.trim();
      case "dates":
        return form.alreadyArrived ? !!form.arrivalDate : !!form.moveDate;
      case "residency":
        return !!form.residencyStatus;
      case "visa":
        return !!form.visaType;
      default:
        return true;
    }
  };

  const next = () => {
    setError("");
    if (stepId === "residency" && isEuCitizen(form)) {
      patchForm({ visaType: EU_VISA });
    }
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        visaType: isEuCitizen(form) ? EU_VISA : form.visaType,
      };
      await submitOnboarding(token, payload);
      await refreshUser();
      clearDraft();
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const shellClass = native ? "mob-onboard" : "mx-auto max-w-lg";

  const inner = (
    <>
      <div className="onboard-progress">
        {steps.map((id, i) => (
          <div key={id} className={`onboard-segment ${i <= step ? "done" : ""}`} />
        ))}
      </div>

      <p className="t-label">
        Step {step + 1} of {totalSteps}
      </p>

      {stepId === "welcome" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Welcome to Expal</h1>
          <p className="t-body mb-6">Connect · Discover · Grow — we&apos;ll tailor everything to your move abroad.</p>
        </>
      )}

      {stepId === "destination" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Where are you moving?</h1>
          <p className="t-body mb-5">We&apos;ll personalise your timeline, mentor match, and forums around your destination.</p>
          <Label className="input-label">Country</Label>
          <select
            className="form-input mb-3"
            value={form.destinationCountry}
            onChange={(e) => patchForm({ destinationCountry: e.target.value, destinationCity: "", visaType: "" })}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Label className="input-label">City</Label>
          <select
            className="form-input mb-4"
            value={form.destinationCity}
            onChange={(e) => patchForm({ destinationCity: e.target.value })}
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </>
      )}

      {stepId === "profession" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">What do you do?</h1>
          <Label className="input-label">Profession</Label>
          <Input
            className="form-input mb-3"
            value={form.profession}
            onChange={(e) => patchForm({ profession: e.target.value })}
            placeholder="e.g. Software Engineer"
          />
          <Label className="input-label">Category</Label>
          <select
            className="form-input mb-4"
            value={form.professionCategory}
            onChange={(e) => patchForm({ professionCategory: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Label className="input-label">Employment status</Label>
          <div className="space-y-2">
            {EMPLOYMENT_STATUSES.map(({ value, label }) => (
              <label
                key={value}
                className={`mob-choice ${form.employmentStatus === value ? "mob-choice--on" : ""}`}
              >
                <input
                  type="radio"
                  name="employmentStatus"
                  checked={form.employmentStatus === value}
                  onChange={() => patchForm({ employmentStatus: value })}
                />
                <span className="font-display text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {stepId === "dates" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">When are you moving?</h1>
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--ink-mid))] mb-4 min-h-[44px]">
            <input
              type="checkbox"
              checked={form.alreadyArrived}
              onChange={(e) => patchForm({ alreadyArrived: e.target.checked })}
            />
            I&apos;ve already arrived
          </label>
          {!form.alreadyArrived ? (
            <>
              <Label className="input-label">Move date</Label>
              <Input type="date" className="form-input" value={form.moveDate} onChange={(e) => patchForm({ moveDate: e.target.value })} />
            </>
          ) : (
            <>
              <Label className="input-label">Arrival date</Label>
              <Input type="date" className="form-input" value={form.arrivalDate} onChange={(e) => patchForm({ arrivalDate: e.target.value })} />
            </>
          )}
        </>
      )}

      {stepId === "residency" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Your residency status</h1>
          <p className="t-body mb-4">
            EU / EEA / Swiss citizens don&apos;t need a work permit when relocating within the EU. We&apos;ll skip visa steps for you.
          </p>
          <div className="space-y-2">
            {[
              { value: "eu", label: "I am an EU / EEA / Swiss citizen", hint: "No work permit — freedom of movement" },
              { value: "non_eu", label: "I am a non-EU citizen", hint: "Work permit or visa route applies" },
            ].map(({ value, label, hint }) => (
              <label key={value} className={`mob-choice flex-col items-start ${form.residencyStatus === value ? "mob-choice--on" : ""}`}>
                <span className="flex items-center gap-3 w-full">
                  <input
                    type="radio"
                    name="residencyStatus"
                    checked={form.residencyStatus === value}
                    onChange={() => patchForm({ residencyStatus: value, visaType: value === "eu" ? EU_VISA : "" })}
                  />
                  <span className="font-display text-sm font-semibold">{label}</span>
                </span>
                <span className="text-xs text-[rgb(var(--ink-soft))] pl-7">{hint}</span>
              </label>
            ))}
          </div>
        </>
      )}

      {stepId === "visa" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Your work authorisation</h1>
          <p className="t-body mb-4">
            We&apos;ll personalise your visa guide and timeline. You can change this anytime in Profile.
          </p>
          <div className="space-y-2">
            {visaTypes.map((v) => {
              const value = typeof v === "string" ? v : v.value;
              const label = typeof v === "string" ? v : v.label || v.value;
              const tagline = typeof v === "string" ? "" : v.tagline;
              return (
                <label key={value} className={`mob-choice flex-col items-start ${form.visaType === value ? "mob-choice--on" : ""}`}>
                  <span className="flex items-center gap-3 w-full">
                    <input
                      type="radio"
                      name="visaType"
                      checked={form.visaType === value}
                      onChange={() => patchForm({ visaType: value })}
                    />
                    <span className="font-display text-sm font-semibold">{label}</span>
                  </span>
                  {tagline && <span className="text-xs text-[rgb(var(--ink-soft))] pl-7">{tagline}</span>}
                </label>
              );
            })}
          </div>
        </>
      )}

      {stepId === "family" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Who&apos;s moving with you?</h1>
          {[
            { value: "single", label: "Just me" },
            { value: "couple", label: "Partner" },
            { value: "family_with_kids", label: "Family with kids" },
          ].map(({ value, label }) => (
            <label key={value} className={`mob-choice ${form.familyStatus === value ? "mob-choice--on" : ""}`}>
              <input
                type="radio"
                name="family"
                checked={form.familyStatus === value}
                onChange={() => patchForm({ familyStatus: value })}
              />
              <span className="font-display text-sm font-semibold">{label}</span>
            </label>
          ))}
        </>
      )}

      {stepId === "concerns" && (
        <>
          <h1 className="t-h1 mt-1 mb-2">Biggest concerns?</h1>
          <p className="t-body mb-4">Select all that apply</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CONCERNS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={`badge-coral capitalize min-h-[44px] ${form.concerns.includes(c) ? "!bg-[rgb(var(--coral))] !text-white" : ""}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="text-sm text-[rgb(var(--coral))] mb-3">{error}</p>}

      <div className="flex gap-2 mt-6 pb-8">
        {step > 0 && (
          <Button variant="ghost" onClick={back}>Back</Button>
        )}
        {step < totalSteps - 1 ? (
          <Button className="flex-1 justify-center" onClick={next} disabled={!canContinue()}>
            Continue →
          </Button>
        ) : (
          <Button className="flex-1 justify-center" loading={busy} onClick={finish}>
            Finish setup
          </Button>
        )}
      </div>
    </>
  );

  if (native) {
    return (
      <MobileScreen title="Setup your move">
        <div className={`${shellClass} mob-body`}>{inner}</div>
      </MobileScreen>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
