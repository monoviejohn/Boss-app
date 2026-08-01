// src/app/sitemap.js
// Dynamic sitemap including published portfolio slugs
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || url === "undefined") return null;
  return createClient(url, key);
}

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://boss-africa.vercel.app";
  const supabase = getAdminClient();

  const staticUrls = [
    { url: base, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date() },
    { url: `${base}/portfolios`, lastModified: new Date() },
  ];

  if (!supabase) {
    return staticUrls;
  }

  try {
    const { data: tailors } = await supabase
      .from("tailors")
      .select("portfolio_slug, updated_at")
      .eq("portfolio_visible", true)
      .not("portfolio_slug", "is", null);

    if (!tailors?.length) return staticUrls;

    const portfolioUrls = tailors.map(t => ({
      url: `${base}/t/${t.portfolio_slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
    }));

    return [...staticUrls, ...portfolioUrls];
  } catch {
    return staticUrls;
  }
}