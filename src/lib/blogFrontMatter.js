const MAX_TITLE = 80;
const MAX_SEO_TITLE = 70;
const MAX_SEO_DESCRIPTION = 160;
const MAX_EXCERPT = 500;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unquote(value) {
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }
  return trimmed;
}

function splitList(inner) {
  const parts = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quote) {
      if (ch === "\\" && i + 1 < inner.length) {
        current += inner[i + 1];
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ",") {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return splitList(inner);
  }
  return unquote(value);
}

function parseFrontMatter(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("Post must start with --- front matter.");
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) throw new Error("Front matter is not closed with ---.");
  const data = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx === -1) throw new Error(`Bad front matter line: ${line}`);
    const key = line.slice(0, idx).trim();
    data[key] = parseValue(line.slice(idx + 1).trim());
  }
  const content = normalized.slice(end + 5).replace(/^\n/, "").trim();
  return { data, content };
}

function validatePost(data, content, fileSlug) {
  const errors = [];
  const title = String(data.title || "").trim();
  const slug = String(data.slug || "").trim();
  const seoTitle = data.seoTitle == null ? "" : String(data.seoTitle).trim();
  const seoDescription = String(data.seoDescription || "").trim();
  const excerpt = data.excerpt == null ? "" : String(data.excerpt).trim();
  const author = String(data.author || "").trim();
  const tags = Array.isArray(data.tags) ? data.tags.map((tag) => String(tag).trim()).filter(Boolean) : null;

  if (!title) errors.push("Add a title.");
  else if ([...title].length > MAX_TITLE) {
    errors.push(`Title is ${[...title].length} characters. Keep it to ${MAX_TITLE} or fewer.`);
  }
  if (!SLUG_RE.test(slug)) errors.push("Slug must be lowercase words separated by hyphens.");
  if (fileSlug && slug && fileSlug !== slug) errors.push("The file name must match the slug.");
  if (seoTitle && [...seoTitle].length > MAX_SEO_TITLE) {
    errors.push(`seoTitle is ${[...seoTitle].length} characters. Keep it to ${MAX_SEO_TITLE} or fewer.`);
  }
  if (!seoDescription) errors.push("Add a seoDescription.");
  else if ([...seoDescription].length > MAX_SEO_DESCRIPTION) {
    errors.push(
      `seoDescription is ${[...seoDescription].length} characters. Keep it to ${MAX_SEO_DESCRIPTION} or fewer.`
    );
  }
  if ([...excerpt].length > MAX_EXCERPT) errors.push(`Excerpt must be ${MAX_EXCERPT} characters or fewer.`);
  if (!tags) errors.push("Tags must be a list, for example [housing, ireland].");
  if (!author) errors.push("Add an author.");
  if (typeof data.published !== "boolean") errors.push("published must be true or false.");
  if (data.lastReviewed != null && data.lastReviewed !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.lastReviewed))) {
    errors.push("lastReviewed must look like 2026-11-26.");
  }
  if (!String(content || "").trim()) errors.push("The article text is empty.");

  return {
    errors,
    post: {
      title,
      slug,
      seoTitle,
      seoDescription,
      excerpt,
      tags: tags || [],
      author,
      published: data.published === true,
      lastReviewed: data.lastReviewed ? String(data.lastReviewed) : "",
      content: String(content || "").trim(),
    },
  };
}

function parsePostText(text, fileSlug) {
  try {
    const { data, content } = parseFrontMatter(text);
    return validatePost(data, content, fileSlug);
  } catch (err) {
    return {
      errors: [err.message || "Could not read this post."],
      post: null,
    };
  }
}

function toApiBody(post) {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    published: post.published,
    author: post.author,
  };
}

module.exports = {
  MAX_TITLE,
  MAX_SEO_TITLE,
  MAX_SEO_DESCRIPTION,
  parseFrontMatter,
  parsePostText,
  toApiBody,
  validatePost,
};
