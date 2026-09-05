import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const SITE = "EXPal";
const DEFAULT_DESC =
  "EXPal helps expats relocate smarter — housing, visa guidance, community, and employment support.";

/**
 * Sets document title + meta for public SEO pages.
 */
export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = "/",
  type = "website",
  image,
}) {
  const fullTitle = title ? `${title} | ${SITE}` : `${SITE} — Your friend away from home`;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://expalapp.netlify.app";
  const url = `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = image || `${origin}/expal-logo.png`;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
