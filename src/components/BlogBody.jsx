import React from "react";
import { Link } from "react-router-dom";

const SITE_HOSTS = ["expalapp.netlify.app"];

function isInternal(href) {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    return SITE_HOSTS.includes(new URL(href).hostname);
  } catch {
    return false;
  }
}

function internalPath(href) {
  if (href.startsWith("/")) return href;
  const u = new URL(href);
  return `${u.pathname}${u.search}${u.hash}` || "/";
}

function formatInline(text, keyPrefix = "") {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m;
  const s = String(text);
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}${parts.length}`;
    if (token.startsWith("**")) {
      parts.push(<strong key={key}>{formatInline(token.slice(2, -2), `${key}-`)}</strong>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      const href = linkMatch ? linkMatch[2] : "";
      if (!linkMatch || !/^(https?:|mailto:|\/|#)/i.test(href)) {
        parts.push(linkMatch ? linkMatch[1] : token);
      } else if (isInternal(href) && !href.startsWith("#")) {
        parts.push(
          <Link key={key} to={internalPath(href)}>
            {linkMatch[1]}
          </Link>
        );
      } else {
        parts.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts.length ? parts : s;
}

function sectionClass(title) {
  const t = title.toLowerCase();
  if (t === "sources" || t.startsWith("sources")) return "blog-section blog-section-sources";
  if (t === "faq" || t.includes("frequently asked")) return "blog-section blog-section-faq";
  return "blog-section";
}

function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .replace(/\*\*|\[|\]\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Light markdown renderer for blog posts:
 * ## and ### headings, paragraphs, "- " bullets, "1. " numbered lists, **bold**, [links](url).
 * "## Sources" and "## FAQ" sections get their own styling.
 */
export default function BlogBody({ body }) {
  if (!body) return null;
  const lines = String(body).replace(/\r\n/g, "\n").split("\n");
  const sections = [{ title: null, blocks: [] }];
  let list = null;
  const current = () => sections[sections.length - 1];

  function flushList() {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    const k = `l-${sections.length}-${current().blocks.length}`;
    current().blocks.push(
      <Tag key={k} className={list.ordered ? "blog-prose-ol" : "blog-prose-ul"}>
        {list.items.map((t, i) => (
          <li key={i}>{formatInline(t, `${k}-${i}-`)}</li>
        ))}
      </Tag>
    );
    list = null;
  }

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    let m;
    if ((m = trimmed.match(/^(#{1,2})\s+(.*)$/))) {
      flushList();
      sections.push({ title: m[2], blocks: [] });
      continue;
    }
    if ((m = trimmed.match(/^###\s+(.*)$/))) {
      flushList();
      current().blocks.push(
        <h3 key={`h3-${sections.length}-${current().blocks.length}`} className="blog-prose-h3">
          {formatInline(m[1])}
        </h3>
      );
      continue;
    }
    if ((m = trimmed.match(/^[-*]\s+(.*)$/))) {
      if (list && list.ordered) flushList();
      if (!list) list = { ordered: false, items: [] };
      list.items.push(m[1]);
      continue;
    }
    if ((m = trimmed.match(/^\d+[.)]\s+(.*)$/))) {
      if (list && !list.ordered) flushList();
      if (!list) list = { ordered: true, items: [] };
      list.items.push(m[1]);
      continue;
    }
    flushList();
    current().blocks.push(
      <p key={`p-${sections.length}-${current().blocks.length}`} className="blog-prose-p">
        {formatInline(trimmed)}
      </p>
    );
  }
  flushList();

  return (
    <div className="blog-prose">
      {sections.map((section, i) =>
        section.title === null ? (
          section.blocks.length ? <div key={i}>{section.blocks}</div> : null
        ) : (
          <section key={i} className={sectionClass(section.title)} id={slugifyHeading(section.title)}>
            <h2 className="blog-prose-h2">{formatInline(section.title)}</h2>
            {section.blocks}
          </section>
        )
      )}
    </div>
  );
}
