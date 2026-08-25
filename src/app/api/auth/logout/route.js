import { NextResponse } from "next/server";
import { buildLogoutCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookie = buildLogoutCookie();
  res.cookies.set(cookie.name, cookie.value, cookie);
  return res;
}
