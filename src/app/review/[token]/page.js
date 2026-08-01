"use client";
// src/app/review/[token]/page.js
// Public review page — no auth required. Customer submits 1-5 star review + text.
import { useState, useEffect, Suspense } from "react";

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

function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; }
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 14, color: C.sub }}>Loading…</div>
    </div>
  );
}

async function getReviewRequest(token) {
  try {
    const res = await fetch(`/api/review/${token}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function ReviewPage({ params }) {
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
        <Suspense fallback={<Loading />}>
          <ReviewContent token={params.token} />
        </Suspense>
      </body>
    </html>
  );
}

async function ReviewContent({ token }) {
  const data = await getReviewRequest(token);

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
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

  const { tailor, order } = data;
  const isCompleted = !!data.review;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px 48px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header — tailor's shop identity */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>Review for</div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px", color: C.text, marginBottom: 4 }}>{tailor.shop}</div>
        {tailor.city && <div style={{ fontSize: 13, color: C.sub }}>📍 {tailor.city}</div>}
        {order && (
          <div style={{ fontSize: 13, color: C.sub, marginTop: 8 }}>
            Order: {order.type || "Custom order"} · {fmtDate(order.delivery_date || order.created_at)}
          </div>
        )}
      </div>

      {isCompleted ? (
        <div style={{ background: C.s1, borderRadius: 20, padding: "24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Thanks for your review!</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
            Your feedback helps {tailor.shop} grow and helps other customers make great choices.
          </div>
          <div style={{ marginTop: 20, fontSize: 13, color: C.muted || C.sub }}>
            Powered by <span style={{ color: C.gold, fontWeight: 700 }}>BOSS</span>
          </div>
        </div>
      ) : (
        <ReviewForm token={token} tailor={tailor} order={order} />
      )}
    </div>
  );
}

function ReviewForm({ token, tailor, order }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating"); return; }
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!reviewText.trim()) { setError("Please write your review"); return; }
    if (reviewText.length > 1000) { setError("Review is too long (max 1000 characters)"); return; }
    submitReview();
  }

  async function submitReview() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, name: name.trim(), review_text: reviewText.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit review");
      window.location.reload();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Star Rating */}
      <div style={{ background: C.s1, borderRadius: 20, padding: "20px" }}>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12, textAlign: "center" }}>
          Your Rating
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[1,2,3,4,5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => { setRating(star); }}
              style={{
                background: "none", border: "none", padding: 0,
                cursor: "pointer", fontSize: 44, lineHeight: 1,
                color: rating >= star ? C.gold : C.s3,
                transition: "transform 0.1s, color 0.1s",
                transform: rating === star ? "scale(1.15)" : "scale(1)",
              }}
              aria-label={`${star} star${star>1?"s":""}`}
            >
              ★
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 13, color: C.sub }}>
          {["Terrible", "Poor", "Okay", "Great", "Amazing"][rating-1] || "Tap a star"}
        </div>
      </div>

      {/* Name */}
      <div style={{ background: C.s1, borderRadius: 20, padding: "20px" }}>
        <label style={{ display: "block", fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 8 }}>
          Your Name <span style={{ color: C.red }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Ada"
          required
          maxLength={80}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            border: `1.5px solid ${name && name.length>0 ? C.green : C.border}`,
            background: C.s1, color: C.text, fontSize: 16, fontFamily: "inherit",
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* Review Text */}
      <div style={{ background: C.s1, borderRadius: 20, padding: "20px" }}>
        <label style={{ display: "block", fontSize: 13, color: C.sub, fontWeight: 600, marginBottom: 8 }}>
          Your Review <span style={{ color: C.red }}>*</span>
        </label>
        <textarea
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          placeholder="What did you love? How was the fit, quality, communication? Be specific — it helps others!"
          required
          maxLength={1000}
          rows={5}
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 12,
            border: `1.5px solid ${reviewText && reviewText.length>0 ? C.green : C.border}`,
            background: C.s1, color: C.text, fontSize: 15, fontFamily: "inherit",
            outline: "none", resize: "vertical", minHeight: 120, boxSizing: "border-box", lineHeight: 1.5,
          }}
        />
        <div style={{ textAlign: "right", marginTop: 6, fontSize: 12, color: C.sub }}>
          {reviewText.length}/1000
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", background: `${C.red}15`, border: `1px solid ${C.red}40`,
          borderRadius: 12, color: C.red, fontSize: 13, fontWeight: 600, textAlign: "center",
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%", padding: "16px 20px",
          background: submitting ? `${C.accent}80` : C.accent,
          color: "#fff", border: "none", borderRadius: 14,
          fontSize: 16, fontWeight: 700, fontFamily: "inherit",
          cursor: submitting ? "default" : "pointer",
        }}
      >
        {submitting ? "Submitting…" : "✅ Submit Review"}
      </button>

      <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
        Powered by <span style={{ color: C.gold, fontWeight: 700 }}>BOSS</span> · Build Trust. Grow Faster.
      </div>
    </form>
  );
}