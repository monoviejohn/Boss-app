// src/app/api/portfolio/[slug]/route.js
// Public API — no auth required. Returns tailor portfolio data.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || url === "undefined") return null;
  return createClient(url, key);
}

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  // Find tailor by portfolio_slug where portfolio_visible = true
  const { data: tailor, error: tailorErr } = await supabase
    .from("tailors")
    .select("id, shop, phone, city, craft, bos_score, logo_url, portfolio_slug, portfolio_visible")
    .eq("portfolio_slug", slug)
    .eq("portfolio_visible", true)
    .single();

  if (tailorErr || !tailor) {
    return NextResponse.json(
      { error: "Portfolio not found. It may be private or the link is invalid.", detail: tailorErr?.message || null },
      { status: 404 }
    );
  }

  // Get portfolio items (photos)
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, image_url, caption, created_at")
    .eq("tailor_id", tailor.id)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Get public reviews
  const { data: reviews } = await supabase
    .from("portfolio_reviews")
    .select("id, reviewer_name, rating, review_text, created_at")
    .eq("tailor_id", tailor.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    tailor,
    items: items || [],
    reviews: reviews || [],
  });
}