// src/app/api/portfolios/route.js
// Public API — lists published, opted-in portfolios with filters
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || url === "undefined") return null;
  return createClient(url, key);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const craft = searchParams.get("craft");

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  // Build query for tailors with portfolio_visible = true
  let query = supabase
    .from("tailors")
    .select(`
      id, shop, phone, city, craft, bos_score, logo_url, portfolio_slug, portfolio_visible,
      portfolio_items (id, image_url),
      portfolio_reviews (id, rating)
    `)
    .eq("portfolio_visible", true);

  if (city) query = query.eq("city", city);
  if (craft) query = query.eq("craft", craft);

  const { data: tailors, error } = await query.order("bos_score", { ascending: false });

  if (error) {
    console.error("[api/portfolios] query error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolios", detail: error.message }, { status: 500 });
  }

  const portfolios = (tailors || []).map(t => ({
    tailor: {
      id: t.id,
      shop: t.shop,
      phone: t.phone,
      city: t.city,
      craft: t.craft,
      bos_score: t.bos_score,
      logo_url: t.logo_url,
      portfolio_slug: t.portfolio_slug,
      portfolio_visible: t.portfolio_visible,
    },
    items_count: t.portfolio_items?.length || 0,
    reviews_count: t.portfolio_reviews?.length || 0,
    avg_rating: t.portfolio_reviews?.length
      ? t.portfolio_reviews.reduce((s, r) => s + r.rating, 0) / t.portfolio_reviews.length
      : null,
  }));

  return NextResponse.json({ portfolios });
}