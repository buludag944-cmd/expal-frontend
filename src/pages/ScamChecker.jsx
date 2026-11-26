import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import PublicSiteHeader from "../components/PublicSiteHeader";
import Seo from "../components/Seo";
import { MobileScreen } from "../components/mobile/MobileShared";
import { isNativeApp } from "../lib/platform";
import {
  LEVEL_COPY,
  PHOTO_CHECK_URL,
  QUESTIONS,
  SAFETY_STEPS,
  SOURCES,
  advertSearchUrl,
  analyzeListing,
  phoneReportSearchUrl,
} from "../lib/rentalScamCheck";
import "../styles/public-marketing.css";
import "../styles/scam-checker.css";

function QuickChecks({ text, phone }) {
  const advertUrl = advertSearchUrl(text);
  const phoneUrl = phoneReportSearchUrl(phone);
  return (
    <section className="scam-quick" aria-labelledby="scam-quick-title">
      <h2 id="scam-quick-title">Quick online checks</h2>
      <p className="scam-hint">
        One tap each. They open a search in your browser and look for traces of a scam, not for information about a person.
      </p>
      <div className="scam-quick-list">
        <a
          className={`scam-quick-btn${advertUrl ? "" : " is-disabled"}`}
          href={advertUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!advertUrl}
          onClick={(e) => !advertUrl && e.preventDefault()}
        >
          <strong>Find copies of this advert</strong>
          <span>{advertUrl ? "Scammers reuse the same text in many fake listings." : "Paste the advert text above first."}</span>
        </a>
        <a
          className={`scam-quick-btn${phoneUrl ? "" : " is-disabled"}`}
          href={phoneUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!phoneUrl}
          onClick={(e) => !phoneUrl && e.preventDefault()}
        >
          <strong>Search scam reports for this number</strong>
          <span>{phoneUrl ? "Looks for the number next to words like scam or fraud." : "Enter the phone number above first."}</span>
        </a>
        <a className="scam-quick-btn" href={PHOTO_CHECK_URL} target="_blank" rel="noopener noreferrer">
          <strong>Check the photos</strong>
          <span>Upload a listing photo to Google Lens to see if it's copied from elsewhere.</span>
        </a>
      </div>
    </section>
  );
}

function Checker() {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
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
    setPhone("");
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
          <span className="scam-hint">Leave out personal details you don't need, like bank details.</span>
        </label>

        <label className="scam-field">
          <span className="scam-label">The number they're contacting you from (optional)</span>
          <input
            className="scam-input"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 087 123 4567"
          />
          <span className="scam-hint">Only used for the scam-report search below. It isn't saved or sent to EXPal.</span>
        </label>

        <QuickChecks text={text} phone={phone} />

        {QUESTIONS.map((q) => (
          <div key={q.id} className="scam-question" role="radiogroup" aria-labelledby={`q-${q.id}`}>
            <p id={`q-${q.id}`} className="scam-label">
              {q.label}
            </p>
            <div className="scam-options">
              {q.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.id] === o.value}
                  className={`scam-option${answers[q.id] === o.value ? " is-on" : ""}`}
                  onClick={() => setAnswer(q.id, o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
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
