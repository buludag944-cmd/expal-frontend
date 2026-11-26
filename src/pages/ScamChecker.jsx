import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import PublicSiteHeader from "../components/PublicSiteHeader";
import Seo from "../components/Seo";
import { MobileScreen } from "../components/mobile/MobileShared";
import { isNativeApp } from "../lib/platform";
import { LEVEL_COPY, QUESTIONS, SAFETY_STEPS, SOURCES, analyzeListing } from "../lib/rentalScamCheck";
import "../styles/public-marketing.css";
import "../styles/scam-checker.css";

function Checker() {
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const result = useMemo(() => analyzeListing({ text, answers }), [text, answers]);
  const copy = LEVEL_COPY[result.level];
  const canCheck = Object.keys(answers).length >= 3 || text.trim().length > 40;

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function reset() {
    setText("");
    setAnswers({});
    setChecked(false);
  }

  return (
    <div className="scam">
      <header className="scam-intro">
        <p className="scam-kicker">Rental scam checker</p>
        <h1>Is this rental genuine?</h1>
        <p>
          Paste the advert or the landlord's messages and answer a few questions. We check them against the warning signs
          published by the Gardaí and the CCPC. Everything stays on your device.
        </p>
      </header>

      <form
        className="scam-form"
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
          setTimeout(() => document.getElementById("scam-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
        }}
      >
        <label className="scam-field">
          <span className="scam-label">Advert text or messages (optional)</span>
          <textarea
            className="scam-textarea ugc-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the listing or the chat with the landlord here…"
          />
          <span className="scam-hint">Leave out personal details you don't need, like phone numbers or bank details.</span>
        </label>

        {QUESTIONS.map((q) => (
          <fieldset key={q.id} className="scam-question">
            <legend>{q.label}</legend>
            <div className="scam-options">
              {q.options.map((o) => (
                <label key={o.value} className={`scam-option${answers[q.id] === o.value ? " is-on" : ""}`}>
                  <input
                    type="radio"
                    name={q.id}
                    value={o.value}
                    checked={answers[q.id] === o.value}
                    onChange={() => setAnswer(q.id, o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="scam-actions">
          <button type="submit" className="scam-btn-primary" disabled={!canCheck}>
            Check this rental
          </button>
          {(checked || text || Object.keys(answers).length > 0) && (
            <button type="button" className="scam-btn-link" onClick={reset}>
              Start again
            </button>
          )}
        </div>
        {!canCheck && <p className="scam-hint">Answer at least 3 questions or paste the advert to get a result.</p>}
      </form>

      {checked && (
        <section id="scam-result" className={`scam-result scam-result--${result.level}`} aria-live="polite">
          <p className="scam-level">{copy.label}</p>
          <p className="scam-summary">{copy.summary}</p>
          {result.flags.length > 0 && (
            <ul className="scam-flags">
              {result.flags.map((f) => (
                <li key={f.id} className={`scam-flag scam-flag--w${f.weight}`}>
                  <strong>{f.title}</strong>
                  <span>{f.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="scam-steps" aria-labelledby="scam-steps-title">
        <h2 id="scam-steps-title">Before you pay anything</h2>
        <ol>
          {SAFETY_STEPS.map((s) => (
            <li key={s.title}>
              <strong>{s.title}</strong>
              <span>{s.detail}</span>
              {s.href && (
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.linkLabel} →
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      <p className="scam-disclaimer">
        This checker looks for common warning signs. It can't confirm who someone is or guarantee a listing is genuine, so
        always view the property and sign a lease before paying. Sources:{" "}
        {SOURCES.map((s, i) => (
          <React.Fragment key={s.href}>
            {i > 0 && " · "}
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

export default function ScamChecker() {
  const { user } = useAuth();

  if (isNativeApp()) {
    return (
      <MobileScreen title="Scam checker" backTo="/housing">
        <Checker />
      </MobileScreen>
    );
  }

  return (
    <div className={user ? "" : "public-page"}>
      <Seo
        title="Rental scam checker for Ireland"
        description="Check a rental listing or landlord's messages against the Garda and CCPC warning signs before you pay a deposit in Ireland."
        path="/scam-checker"
      />
      {!user && <PublicSiteHeader />}
      <main className={user ? "" : "public-main"}>
        <Checker />
        {!user && (
          <p className="scam-disclaimer">
            Looking for a safer way to find housing? <Link to="/#sign-in">Join EXPal free</Link> for expat-friendly listings.
          </p>
        )}
      </main>
    </div>
  );
}
