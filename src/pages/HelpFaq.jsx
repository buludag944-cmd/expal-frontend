import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isNativeApp } from "../lib/platform";
import { MobileScreen } from "../components/mobile/MobileShared";
import { restartWalkthrough } from "../components/Walkthrough";
import { FAQ_CATEGORIES, filterFaqs, getAllFaqs } from "../data/faqContent";

function FaqAccordion({ categories, openKey, setOpenKey, idPrefix = "faq" }) {
  return (
    <>
      {categories.map((cat) => (
        <section key={cat.id} className="mob-faq-category">
          <h2 id={`${idPrefix}-${cat.id}-heading`} className="mob-section-title">
            <span className="mob-faq-cat-icon" aria-hidden>
              {cat.icon}
            </span>
            {cat.title}
            <span className="mob-faq-cat-count">({cat.items.length})</span>
          </h2>
          {cat.items.map((item) => {
            const key = `${cat.id}:${item.q}`;
            const isOpen = openKey === key;
            return (
              <div key={key} className="mob-faq-item">
                <button
                  type="button"
                  className="mob-faq-question"
                  onClick={() => setOpenKey(isOpen ? null : key)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span className="mob-faq-toggle" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && <p className="mob-faq-answer">{item.a}</p>}
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}

function FaqFooter({ onReplay, native }) {
  return (
    <div className="mob-faq-footer">
      <button type="button" className="mob-btn-secondary mob-faq-replay" onClick={onReplay}>
        Replay walkthrough
      </button>
      <p className="mob-faq-support">
        Still stuck?{" "}
        <Link to="/profile" className="mob-faq-link">
          Contact founder
        </Link>{" "}
        from Profile, or email{" "}
        <a href="mailto:expalappsupport@gmail.com" className="mob-faq-link">
          expalappsupport@gmail.com
        </a>
        .
      </p>
      {!native && (
        <p className="mob-faq-meta">{getAllFaqs().length} answers across {FAQ_CATEGORIES.length} topics</p>
      )}
    </div>
  );
}

function FaqSearch({ value, onChange, native }) {
  return (
    <div className={native ? "mob-search-wrap mob-faq-search" : "mb-4"}>
      <input
        className={native ? "mob-search-input" : "w-full rounded-lg border border-border px-3 py-2 text-sm"}
        type="search"
        placeholder="Search questions…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search help topics"
      />
    </div>
  );
}

export default function HelpFaq() {
  const native = isNativeApp();
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null);

  const filtered = useMemo(() => filterFaqs(search), [search]);
  const totalShown = filtered.reduce((n, c) => n + c.items.length, 0);

  const replay = () => {
    restartWalkthrough();
    window.location.assign("/");
  };

  const intro = (
    <>
      <FaqSearch value={search} onChange={setSearch} native={native} />
      {search.trim() && (
        <p className={native ? "mob-faq-results-hint" : "text-sm text-muted mb-4"}>
          {totalShown === 0
            ? `No matches for “${search.trim()}”. Try another keyword or contact support.`
            : `${totalShown} result${totalShown === 1 ? "" : "s"} for “${search.trim()}”`}
        </p>
      )}
    </>
  );

  if (native) {
    return (
      <MobileScreen title="Help & FAQs" backTo="/profile" count={getAllFaqs().length}>
        <div className="mob-body mob-faq-page">
          <p className="mob-faq-intro">
            Answers about account, community, housing, visa, messages, notifications, and troubleshooting.
          </p>
          {intro}
          {totalShown > 0 && (
            <FaqAccordion categories={filtered} openKey={openKey} setOpenKey={setOpenKey} />
          )}
          <FaqFooter onReplay={replay} native={native} />
        </div>
      </MobileScreen>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 mob-faq-page">
      <Link to="/profile" className="text-sm underline">
        ← Profile
      </Link>
      <h1 className="font-display text-2xl font-bold mt-4">Help & FAQs</h1>
      <p className="text-muted text-sm mb-2">
        {getAllFaqs().length} answers across {FAQ_CATEGORIES.length} topics — account, community, housing,
        visa, messages, and more.
      </p>
      {intro}
      {totalShown > 0 && (
        <div className="mt-2">
          <FaqAccordion categories={filtered} openKey={openKey} setOpenKey={setOpenKey} idPrefix="web-faq" />
        </div>
      )}
      <FaqFooter onReplay={replay} native={native} />
    </div>
  );
}
