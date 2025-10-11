import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

let cachedData: any[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60_000; // 1 minute

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invalidate = searchParams.has("invalidate");
  const now = Date.now();

  // 🔄 If requested, invalidate the cache manually
  if (invalidate) {
    cachedData = null;
    console.log("♻️ Cache invalidated manually");
  }

  // ⚡ Serve from cache if still valid
  if (cachedData && now - lastFetch < CACHE_DURATION) {
    console.log("⚡ Serving apartments from cache");
    return NextResponse.json(cachedData);
  }

  console.log("🌐 Fetching apartments from Supabase...");
  const { data, error } = await supabase.from("apartments").select("*");

  if (error) {
    console.error("❌ Supabase fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 🧠 Cache new data
  cachedData = data;
  lastFetch = now;

  console.log(`✅ Cached ${data?.length || 0} apartments`);
  return NextResponse.json(data);
}
