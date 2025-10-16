import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

let cachedData: any[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invalidate = searchParams.has("invalidate");
  const now = Date.now();

  if (invalidate) {
    cachedData = null;
  }

  if (cachedData && now - lastFetch < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }

  const { data, error } = await supabase.from("apartments").select("*");

  if (error) {
    console.error("upabase fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  cachedData = data;
  lastFetch = now;

  return NextResponse.json(data);
}
