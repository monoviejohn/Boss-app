// src/app/review/[token]/page.js
// Server Component — handles metadata, renders Client Component
import { Suspense } from "react";
import ReviewClient from "./ReviewClient";

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

async function getReviewRequest(token) {
  try {
    const res = await fetch(`/api/review/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await getReviewRequest(params.token);
  if (!data) return { title: "Review — BOSS" };

  const { tailor, order, review } = data;
  const isCompleted = !!review;

  if (isCompleted) {
    return {
      title: `Review submitted for ${tailor.shop} — BOSS`,
      description: `Thank you for reviewing ${tailor.shop}. Your feedback helps others make great choices.`,
    };
  }

  return {
    title: `Review ${tailor.shop} — BOSS`,
    description: `Share your experience with ${tailor.shop} in ${tailor.city || "Lagos"}. Your review helps others make great choices.`,
    openGraph: {
      title: `Review ${tailor.shop} — BOSS`,
      description: `Share your experience with ${tailor.shop}.`,
      siteName: "BOSS",
      type: "website",
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }) {
  const data = await getReviewRequest(params.token);

  if (!data) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 24,
        background: C.bg, color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Review Link Invalid</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
            This review link may be expired or invalid. Please ask the tailor to send a new one.
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 24,
        background: C.bg, color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        <div style={{ fontSize: 14, color: C.sub }}>Loading…</div>
      </div>
    }>
      <ReviewClient initialData={data} token={params.token} />
    </Suspense>
  );
}