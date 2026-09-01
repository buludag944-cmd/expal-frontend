import React from "react";
import { Link } from "react-router-dom";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";

const SUPPORT_EMAIL = "expalappsupport@gmail.com";

function PrivacyContent({ native = false }) {
  return (
    <>
      {!native && (
        <Link to="/" className="text-primary font-medium hover:underline">
          ← Back to Expal
        </Link>
      )}
      {!native && <h1 className="text-2xl font-bold mt-6 mb-2">Privacy Policy</h1>}
      {native && <h1 className="mob-legal-title">Privacy Policy</h1>}
      <p className={native ? "mob-legal-muted" : "text-muted mb-6"}>Last updated: May 2026</p>

      <p className="mob-legal-p">
        Expal (&quot;we&quot;, &quot;our&quot;) helps expats connect, plan relocation, and share community
        information. This policy explains what data we collect and how we use it when you use the Expal
        app or website at expalapp.netlify.app.
      </p>

      <h2 className="mob-legal-h2">Information we collect</h2>
      <ul className="mob-legal-list">
        <li>
          <strong>Account data:</strong> When you sign in with Google, we receive your name, email, and
          profile photo from Google/Firebase to create your account.
        </li>
        <li>
          <strong>Profile &amp; relocation data:</strong> Information you add (city, profession, visa
          type, bio, interests, etc.) to personalise your experience.
        </li>
        <li>
          <strong>Content you post:</strong> Forum threads, housing listings, events, messages, guides,
          and comments you create in the app.
        </li>
        <li>
          <strong>Device data (optional):</strong> If you allow notifications on the mobile app, we may
          store a push notification token to send alerts about messages or comments.
        </li>
      </ul>

      <h2 className="mob-legal-h2">How we use your data</h2>
      <ul className="mob-legal-list">
        <li>Provide sign-in, your profile, forums, messaging, and relocation tools</li>
        <li>Match mentors and personalise visa guides and timelines</li>
        <li>Send service-related emails or push notifications (if enabled)</li>
        <li>Keep the service secure and fix bugs</li>
      </ul>

      <h2 className="mob-legal-h2">Where data is stored</h2>
      <p className="mob-legal-p">
        Account and content data are stored on our servers (hosted on Render with a PostgreSQL database).
        Google Sign-In is provided by Firebase/Google. We do not sell your personal data.
      </p>

      <h2 className="mob-legal-h2">Sharing</h2>
      <p className="mob-legal-p">
        Other users may see information you choose to make public (profile fields, posts, forum
        threads, listings). We may share data with service providers (hosting, email) only to run the
        app. We may disclose data if required by law.
      </p>

      <h2 className="mob-legal-h2">Your choices</h2>
      <ul className="mob-legal-list">
        <li>Update or delete content you posted (where the app allows edit/delete)</li>
        <li>Contact us to request account deletion</li>
        <li>Revoke Google access via your Google Account settings</li>
      </ul>

      <h2 className="mob-legal-h2">Children</h2>
      <p className="mob-legal-p">Expal is not intended for users under 16.</p>

      <h2 className="mob-legal-h2">Contact</h2>
      <p className="mob-legal-p">
        Questions or deletion requests:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mob-legal-link">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </>
  );
}

export default function Privacy() {
  const native = isNativeApp();

  if (native) {
    return (
      <MobileScreen title="Privacy Policy" backTo="/profile">
        <div className="mob-body mob-legal-content">
          <PrivacyContent native />
        </div>
      </MobileScreen>
    );
  }

  return (
    <article className="mx-auto max-w-prose px-4 py-8 md:py-12 text-sm leading-relaxed text-foreground">
      <PrivacyContent />
    </article>
  );
}
