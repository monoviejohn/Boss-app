// src/app/t/[slug]/page.js
// Server Component — handles metadata + data fetching, renders Client Component
import { Suspense } from "react";
import PortfolioClient from "./PortfolioClient";

const C = {
  bg:      "#F5F5F7",
  s1:      "#FFFFFF",
  s2:      "#F2F2F7",
  s3:      "#E5E5EA",
  text:    "#1C1C1E",
  sub:     "#8E8E93",
  accent:  "#0066CC",
  green:   "#30D158",
  red:     "#FF453A",
  amber:   "#FF9F0A",
  gold:    "#E8B84B",
  border:  "#E5E5EA",
};

async function getPortfolio(slug) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/portfolio/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await getPortfolio(params.slug);
  if (!data) return { title: "Portfolio — BOSS" };

  const { tailor, reviews, items } = data;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return {
    title: `${tailor.shop} — ${tailor.craft || "Tailor"} in ${tailor.city || "Lagos"}`,
    description: `${tailor.shop} | ${tailor.craft || "Tailor"} in ${tailor.city || "Lagos"} | ${tailor.bos_score ? `BOS Score: ${tailor.bos_score}` : ""} | ${reviews.length} review${reviews.length !== 1 ? "s" : ""}${avgRating ? ` · ${avgRating}/5.0` : ""} | View portfolio & contact via WhatsApp`,
    openGraph: {
      title: `${tailor.shop} — ${tailor.craft || "Tailor"}`,
      description: `${tailor.shop} in ${tailor.city || "Lagos"}. ${reviews.length} review${reviews.length !== 1 ? "s" : ""}. View portfolio & contact.`,
      siteName: "BOSS",
      type: "website",
      images: items.length > 0 ? [items[0].image_url] : [],
    },
    other: {
      "json-ld": JSON.stringify(buildJsonLd(tailor, reviews, avgRating)),
    },
  };
}

function buildJsonLd(tailor, reviews, avgRating) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: tailor.shop,
    address: {
      "@type": "PostalAddress",
      addressLocality: tailor.city || "Lagos",
      addressCountry: "NG",
    },
    telephone: tailor.phone || undefined,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${tailor.portfolio_slug}`,
    image: tailor.logo_url || undefined,
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };
}

export const dynamic = "force-dynamic";

export default async function PortfolioPage({ params }) {
  const data = await getPortfolio(params.slug);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/>
      </head>
      <body style={{
        margin: 0, padding: 0, background: C.bg, color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        WebkitOverflowScrolling: "touch",
      }}>
        <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}><div style={{ fontSize: 14, color: C.sub }}>Loading portfolio…</div></div>}>
          <PortfolioClient initialData={data} slug={params.slug} />
        </Suspense>
      </body>
    </html>
  );
}