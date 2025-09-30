import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "Logged out"});

  // Clear the JWT cookie
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0), // immediately expire
    path: "/",
  });

  return res;
}
