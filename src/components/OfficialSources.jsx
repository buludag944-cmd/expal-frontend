import React from "react";
import { NOT_GOVERNMENT_DISCLAIMER, OFFICIAL_SOURCES } from "../lib/officialSources";

/** Shown wherever the app talks about PPS, IRP, tax or settling in Ireland. */
export default function OfficialSources() {
  return (
    <section className="official-sources" aria-label="Official sources">
      <p className="official-sources-note">{NOT_GOVERNMENT_DISCLAIMER}</p>
      <ul className="official-sources-list">
        {OFFICIAL_SOURCES.map((source) => (
          <li key={source.id}>
            <a href={source.href} target="_blank" rel="noopener noreferrer">
              {source.label}
            </a>
            <span> — {source.publisher}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
