// src/app/api/admin/login/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, generateToken } from "@/lib/auth";
import { Admin } from "@/types";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    console.log("🔎 Login attempt:", username);

    if (!username || !password) {
      console.log("❌ Missing username or password");
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username) as Admin | undefined;

    console.log("📂 DB result:", admin);

    if (!admin) {
      console.log("❌ No admin found with username:", username);
      return NextResponse.json({ error: "Incorrect username" }, { status: 401 });
    }

    const valid = verifyPassword(password, admin.password_hash);

    console.log("🔑 Password valid:", valid);

    if (!valid) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Generate JWT
    const token = generateToken({ id: admin.id, username: admin.username, role: "admin" });

    console.log("✅ Login successful for:", username);

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
