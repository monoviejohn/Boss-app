// src/app/api/review/[token]/route.js
// Public API — no auth required. Uses SERVICE_ROLE_KEY.
// Reviews are immutable once submitted — tailor can only toggle is_public.
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("placeholder") || url === "undefined") return null;
  return createClient(url, key);
}

function getAdminClient() {
  return getServiceClient();
}

export async function GET(request, { params }) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  // Find the review request by token
  const { data: req, error: reqErr } = await supabase
    .from("review_requests")
    .select("id, tailor_id, order_id, completed_at")
    .eq("token", token)
    .single();

  if (reqErr || !req) {
    return NextResponse.json(
      { error: "Review request not found. The link may be invalid or expired." },
      { status: 404 }
    );
  }

  // Check if already completed
  if (req.completed_at) {
    const { data: existingReview } = await supabase
      .from("portfolio_reviews")
      .select("id, rating, reviewer_name, review_text, created_at")
      .eq("review_request_id", req.id)
      .single();

    return NextResponse.json({
      completed: true,
      review: existingReview,
      tailor: await getTailorInfo(supabase, req.tailor_id),
      order: req.order_id ? await getOrderInfo(supabase, req.order_id) : null,
    });
  }

  // Return tailor + order info for the form
  return NextResponse.json({
    completed: false,
    tailor: await getTailorInfo(supabase, req.tailor_id),
    order: req.order_id ? await getOrderInfo(supabase, req.order_id) : null,
  });
}

export async function POST(request, { params }) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rating, name, review_text } = body;

  // Validation
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!review_text || !review_text.trim()) {
    return NextResponse.json({ error: "Review text is required" }, { status: 400 });
  }
  if (review_text.length > 1000) {
    return NextResponse.json({ error: "Review text too long (max 1000 chars)" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });
  }

  // Find the review request
  const { data: req, error: reqErr } = await supabase
    .from("review_requests")
    .select("id, tailor_id, order_id, completed_at")
    .eq("token", token)
    .single();

  if (reqErr || !req) {
    return NextResponse.json({ error: "Review request not found" }, { status: 404 });
  }

  // Prevent duplicate submission
  if (req.completed_at) {
    return NextResponse.json({ error: "Review already submitted for this request" }, { status: 409 });
  }

  // Insert the review (immutable — no UPDATE allowed on review_text/rating)
  const { data: review, error: reviewErr } = await supabase
    .from("portfolio_reviews")
    .insert({
      tailor_id: req.tailor_id,
      order_id: req.order_id,
      review_request_id: req.id,
      reviewer_name: name.trim(),
      rating,
      review_text: review_text.trim(),
      is_public: false, // tailor must approve
    })
    .select("id, created_at")
    .single();

  if (reviewErr) {
    console.error("[api/review] insert review:", reviewErr);
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
  }

  // Mark request as completed
  const { error: completeErr } = await supabase
    .from("review_requests")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", req.id);

  if (completeErr) {
    console.warn("[api/review] mark completed failed:", completeErr);
  }

  return NextResponse.json({ ok: true, reviewId: review.id });
}

async function getTailorInfo(supabase, tailorId) {
  const { data } = await supabase
    .from("tailors")
    .select("id, shop, city, craft")
    .eq("id", tailorId)
    .single();
  return data || { shop: "Tailor", city: "", craft: "" };
}

async function getOrderInfo(supabase, orderId) {
  const { data } = await supabase
    .from("orders")
    .select("id, type, delivery_date, created_at")
    .eq("id", orderId)
    .single();
  return data || { type: "Order", delivery_date: null, created_at: null };
}