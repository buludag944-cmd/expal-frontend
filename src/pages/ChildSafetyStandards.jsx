import React from "react";
import { Link } from "react-router-dom";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";

const SUPPORT_EMAIL = "expalappsupport@gmail.com";

function ChildSafetyContent({ native = false }) {
  return (
    <>
      {!native && (
        <Link to="/" className="text-primary font-medium hover:underline">
          ← Back to Expal
        </Link>
      )}
      {!native && (
        <h1 className="text-2xl font-bold mt-6 mb-2">Child Safety Standards (CSAE)</h1>
      )}
      {native && <h1 className="mob-legal-title">Child Safety Standards (CSAE)</h1>}
      <p className={native ? "mob-legal-muted" : "text-muted mb-6"}>Last updated: June 2026</p>

      <p className="mob-legal-p">
        Expal has zero tolerance for child sexual abuse and exploitation (CSAE), including
        child sexual abuse material (CSAM). These publicly published standards apply to the Expal
        app and website.
      </p>

      <h2 className="mob-legal-h2">Age requirement</h2>
      <p className="mob-legal-p">
        Expal is intended for adults relocating or living abroad. Users must be at least{" "}
        <strong>16 years old</strong>. We do not knowingly collect data from children under 16.
        Accounts suspected of belonging to minors may be removed.
      </p>

      <h2 className="mob-legal-h2">Prohibited content and conduct</h2>
      <ul className="mob-legal-list">
        <li>CSAM or any sexual content involving minors</li>
        <li>Grooming, sexualisation of minors, or solicitation of minors</li>
        <li>Trafficking or exploitation of children</li>
        <li>Content that facilitates harm to children</li>
      </ul>
      <p className="mob-legal-p">
        This applies to forum posts, comments, messages, profiles, housing listings, events, and
        any other user-generated content on Expal.
      </p>

      <h2 className="mob-legal-h2">Prevention and moderation</h2>
      <ul className="mob-legal-list">
        <li>Google Sign-In required for account creation</li>
        <li>Users can report harmful content to our support team</li>
        <li>We review reports and may remove content, suspend, or permanently ban accounts</li>
        <li>We cooperate with law enforcement and authorised child safety organisations when required</li>
      </ul>

      <h2 className="mob-legal-h2">Reporting CSAE on Expal</h2>
      <p className="mob-legal-p">
        If you see content or behaviour that may involve child abuse or exploitation on Expal,
        report it immediately:
      </p>
      <ul className="mob-legal-list">
        <li>
          Email:{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=CSAE%20Report%20-%20Expal`}
            className="mob-legal-link"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          (subject: &quot;CSAE Report&quot;)
        </li>
        <li>Include links, usernames, dates, and a description of the concern</li>
      </ul>
      <p className="mob-legal-p">
        If someone is in immediate danger, contact local emergency services first. In Ireland,
        you may also contact{" "}
        <a href="https://www.hotline.ie/" className="mob-legal-link" target="_blank" rel="noopener noreferrer">
          Hotline.ie
        </a>{" "}
        or your national reporting hotline.
      </p>

      <h2 className="mob-legal-h2">Legal compliance</h2>
      <p className="mob-legal-p">
        We comply with applicable laws regarding child safety and CSAM. Where we become aware of
        CSAM, we will take appropriate action, including content removal, account termination, and
        reporting to relevant authorities as required by law.
      </p>

      <h2 className="mob-legal-h2">Contact</h2>
      <p className="mob-legal-p">
        Child safety questions or reports:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mob-legal-link">
          {SUPPORT_EMAIL}
        </a>
      </p>
      <p className="mob-legal-muted text-xs">
        See also our{" "}
        <Link to="/privacy" className="mob-legal-link">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}

export default function ChildSafetyStandards() {
  const native = isNativeApp();

  if (native) {
    return (
      <MobileScreen title="Child Safety" backTo="/profile">
        <div className="mob-body mob-legal-content">
          <ChildSafetyContent native />
        </div>
      </MobileScreen>
    );
  }

  return (
    <article className="mx-auto max-w-prose px-4 py-8 md:py-12 text-sm leading-relaxed text-foreground">
      <ChildSafetyContent />
    </article>
  );
}
