"use client";
// src/app/t/[slug]/PortfolioClient.js
// Client Component — interactive portfolio UI
import { useState, useEffect } from "react";

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

export default function PortfolioClient({ initialData, slug }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    if (!initialData) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/portfolio/${slug}`, { cache: "no-store" })
        .then(r => r.json())
        .then(setData)
        .catch(() => setData(null));
    }
  }, [initialData, slug]);

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Portfolio Not Found</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
            This portfolio may be private or the link is invalid.
          </div>
        </div>
      </div>
    );
  }

  const { tailor, items, reviews } = data;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : null;
  const scoreColor = tailor.bos_score >= 70 ? C.green : tailor.bos_score >= 45 ? C.amber : C.red;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 20px 48px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Hero — Shop Identity */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        {tailor.logo_url ? (
          <img src={tailor.logo_url} alt={tailor.shop} style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", border: `1px solid ${C.border}`, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: 16, background: C.s2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: C.gold, fontFamily: "Georgia, serif", flexShrink: 0 }}>
            {(tailor.shop || "S")[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", color: C.text, lineHeight: 1.1 }}>{tailor.shop}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6, fontSize: 13, color: C.sub }}>
            {tailor.city && <span>📍 {tailor.city}</span>}
            {tailor.craft && <span>🧵 {tailor.craft}</span>}
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: `${scoreColor}1A`, border: `1px solid ${scoreColor}40`, borderRadius: 20, padding: "4px 10px", fontWeight: 700, color: scoreColor }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: scoreColor, flexShrink: 0 }} />
              BOS Score: {tailor.bos_score || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      {items.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 14 }}>Our Work</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {items.slice(0, 6).map((item, i) => (
              <div key={item.id} style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: C.s2, border: `1px solid ${C.border}` }}>
                <img src={item.image_url} alt={item.caption || `${tailor.shop} — Portfolio ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Reviews</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: C.gold }}>
              <span>★</span>
              <span>{avgRating.toFixed(1)}</span>
              <span style={{ color: C.sub, fontWeight: 400 }}>({reviews.length})</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.reviewer_name}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{fmtDate(r.created_at)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 2, color: C.gold, fontSize: 16 }}>
                    {[1,2,3,4,5].map(star => <span key={star}>★</span>)}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{r.review_text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp CTA */}
      {tailor.phone && (
        <a
          href={`https://wa.me/${(tailor.phone || "").replace(/\D/g, "").replace(/^0/, "234")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "16px 0", textDecoration: "none", marginTop: 8,
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87 1.02 1.03-3.78-.24-.39A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.65 0 5.15 1.03 7.03 2.9A9.93 9.93 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.37c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.19-.57-.34z" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#25D366", letterSpacing: "-0.2px" }}>
            Message {tailor.shop} on WhatsApp
          </span>
        </a>
      )}

      {/* Powered by BOSS — understated footer */}
      <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
          Powered by <span style={{ color: C.gold, fontWeight: 700 }}>BOSS</span> · Build Trust. Grow Faster.
        </div>
      </div>
    </div>
  );
}