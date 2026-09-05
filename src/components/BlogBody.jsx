import React from "react";

function formatInline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  const s = String(text);
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={parts.length}>{token.slice(2, -2)}</strong>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a key={parts.length} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts.length ? parts : s;
}

/** Light markdown-ish body renderer (headings, paragraphs, lists, links, bold). */
export default function BlogBody({ body }) {
  if (!body) return null;
  const lines = String(body).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let listItems = [];

  function flushList() {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="blog-prose-ul">
        {listItems.map((t, i) => (
          <li key={i}>{formatInline(t)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      flushList();
      const text = trimmed.startsWith("## ") ? trimmed.slice(3) : trimmed.slice(2);
      blocks.push(
        <h2 key={`h-${blocks.length}`} className="blog-prose-h2">
          {formatInline(text)}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="blog-prose-p">
        {formatInline(trimmed)}
      </p>
    );
  }
  flushList();
  return <div className="blog-prose">{blocks}</div>;
}
