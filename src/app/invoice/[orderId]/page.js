// src/app/invoice/[orderId]/page.js
// ─────────────────────────────────────────────────────────────────
//  Public invoice page — no login required.
//  Accessible via the link the tailor shares with their customer.
//  Shows a clean receipt document with tailor's payment info.
//  BOSS does not collect payments — tailors receive directly.
// ─────────────────────────────────────────────────────────────────

import { Suspense } from "react";
import InvoiceViewer from "./InvoiceViewer";

const C = {
  bg:      "#080808",
  s1:      "#101010",
  s2:      "#181818",
  gold:    "#E8B84B",
  green:   "#2EC4A0",
  red:     "#F05454",
  sub:     "#777",
  border:  "#222",
  border2: "#2c2c2c",
};

function fmt(n) {
  return "₦" + (parseFloat(n) || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function Loading() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh",
    }}>
      <div style={{ fontSize: 14, color: C.sub, opacity: 0.5 }}>Loading invoice...</div>
    </div>
  );
}

async function getInvoice(orderId) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/invoice/${orderId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { orderId } = await params;
  const data = await getInvoice(orderId);
  if (!data) return { title: "Invoice — BOSS" };
  const { order, customer, tailor } = data;
  const balance = Math.max(0, order.price - order.deposit - order.paid);
  return {
    title:       `Invoice from ${tailor.shop} — BOSS`,
    description: `${customer.name} · ${order.type || "Order"} · Balance: ${fmt(balance)}`,
    openGraph: {
      title:       `Invoice from ${tailor.shop}`,
      description: `${order.type || "Order"} · Balance due: ${fmt(balance)}`,
      siteName:    "BOSS",
    },
  };
}

async function InvoiceContent({ params }) {
  const { orderId } = await params;
  const data = await getInvoice(orderId);

  if (!data) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 24,
      }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Invoice Not Found</div>
          <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
            This link may be invalid or expired. Please ask the shop to resend it.
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: C.sub }}>
            Powered by BOSS · Build Trust. Grow Faster.
          </div>
        </div>
      </div>
    );
  }

  return <InvoiceViewer orderId={orderId} />;
}

export default function InvoicePage({ params }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/>
      </head>
      <body style={{
        margin: 0, padding: 0, background: C.bg, color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        maxWidth: "100%",
        overflowX: "hidden",
      }}>
        <Suspense fallback={<Loading />}>
          <InvoiceContent params={params} />
        </Suspense>
      </body>
    </html>
  );
}