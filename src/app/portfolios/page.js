// src/app/portfolios/page.js
// Portfolio directory — lists published, opted-in portfolios
import { Suspense } from "react";

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

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ fontSize: 14, color: C.sub }}>Loading portfolios…</div>
    </div>
  );
}

async function getPortfolios() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/portfolios`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata() {
  return {
    title: "Find Tailors — BOSS Portfolio Directory",
    description: "Browse verified tailors by city and craft. View portfolios, reviews, and contact directly via WhatsApp.",
    openGraph: {
      title: "Find Tailors — BOSS Portfolio Directory",
      description: "Browse verified tailors by city and craft.",
      siteName: "BOSS",
    },
  };
}

export const dynamic = "force-dynamic";

export default function PortfoliosPage() {
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
          <PortfoliosContent />
        </Suspense>
      </body>
    </html>
  );
}

async function PortfoliosContent() {
  const portfolios = await getPortfolios();

  // Extract unique cities and crafts for filters
  const cities = [...new Set(portfolios.map(p => p.tailor?.city).filter(Boolean))].sort();
  const crafts = [...new Set(portfolios.map(p => p.tailor?.craft).filter(Boolean))].sort();

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 48px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1px", color: C.text, marginBottom: 6 }}>Find a Tailor</div>
        <div style={{ fontSize: 15, color: C.sub }}>Browse portfolios, reviews, and contact directly via WhatsApp</div>
      </div>

      {/* Filters */}
      <div style={{ background: C.s1, borderRadius: 16, padding: "16px", marginBottom: 20, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 6, display: "block" }}>City</label>
            <select
              defaultValue=""
              onChange={e => { window.location.href = `/portfolios?city=${encodeURIComponent(e.target.value)}`; }}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.s1, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none" }}
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 6, display: "block" }}>Craft</label>
            <select
              defaultValue=""
              onChange={e => { window.location.href = `/portfolios?craft=${encodeURIComponent(e.target.value)}`; }}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.s1, color: C.text, fontSize: 15, fontFamily: "inherit", outline: "none" }}
            >
              <option value="">All Crafts</option>
              {crafts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Portfolio Cards */}
      {portfolios.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧵</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No portfolios yet</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
            Tailors who enable their public portfolio will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {portfolios.map(p => (
            <a key={p.tailor.id} href={`/t/${p.tailor.portfolio_slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px", display: "flex", gap: 14 }}>
                {p.tailor.logo_url ? (
                  <img src={p.tailor.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover", border: `1px solid ${C.border}`, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 14, background: C.s2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, color: C.gold, fontFamily: "Georgia, serif", flexShrink: 0 }}>
                    {(p.tailor.shop || "S")[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>{p.tailor.shop}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6, fontSize: 12, color: C.sub }}>
                    {p.tailor.city && <span>📍 {p.tailor.city}</span>}
                    {p.tailor.craft && <span>🧵 {p.tailor.craft}</span>}
                    <span style={{ background: `${p.tailor.bos_score >= 70 ? C.green : p.tailor.bos_score >= 45 ? C.amber : C.red}1A`, border: `1px solid ${p.tailor.bos_score >= 70 ? C.green : p.tailor.bos_score >= 45 ? C.amber : C.red}40`, borderRadius: 20, padding: "2px 8px", fontWeight: 700, color: p.tailor.bos_score >= 70 ? C.green : p.tailor.bos_score >= 45 ? C.amber : C.red }}>
                      Score: {p.tailor.bos_score || 0}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: C.sub, marginTop: 8 }}>
                    {p.reviews_count} review{p.reviews_count !== 1 ? "s" : ""} · {p.items_count} photo{p.items_count !== 1 ? "s" : ""}
                  </div>
                </div>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* JSON-LD ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: portfolios.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${process.env.NEXT_PUBLIC_APP_URL}/t/${p.tailor.portfolio_slug}`,
              name: p.tailor.shop,
              description: `${p.tailor.craft || "Tailor"} in ${p.tailor.city || "Lagos"} · ${p.reviews_count} review${p.reviews_count !== 1 ? "s" : ""}`,
            })),
          }),
        }}
      />

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: C.sub }}>
        Powered by <span style={{ color: C.gold, fontWeight: 700 }}>BOSS</span> · Build Trust. Grow Faster.
      </div>
    </div>
  );
}