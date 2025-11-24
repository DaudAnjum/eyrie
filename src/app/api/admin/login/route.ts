export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { verifyPassword, generateToken } from "@/lib/auth";
import { Admin } from "@/types";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username)
      .single();


    if (error || !admin) {
      return NextResponse.json({ error: "Incorrect username" }, { status: 401 });
    }

    if (!admin.password_hash) {
  return NextResponse.json({ error: "Invalid admin record" }, { status: 500 });
}

    const valid = verifyPassword(password, admin.password_hash);


    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Generate JWT
    const token = generateToken({ id: admin.id, username: admin.username, role: "admin" });


    // Set HttpOnly cookie
    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
      sameSite: "strict",
    });

    return res;
  } catch (err) {
    console.error("💥 Login API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
