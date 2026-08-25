import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "cleanloop_token";

// role -> pages they're allowed under
const ROLE_HOME = {
  resident: "/resident",
  admin: "/admin",
  employee: "/employee",
  volunteer: "/volunteer",
};

// /profile added: it's a shared account page, not tied to one role, so it
// needs auth like the others but must NOT be redirected away below.
const PROTECTED_PREFIXES = ["/resident", "/admin", "/employee", "/volunteer", "/profile"];

async function getRole(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.role;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const role = token ? await getRole(token) : null;

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect a logged-in user away from another role's area into their own.
  // /profile is exempt — it's the one page every role is allowed to be on.
  const ownArea = ROLE_HOME[role];
  if (ownArea && !pathname.startsWith(ownArea) && !pathname.startsWith("/profile")) {
    return NextResponse.redirect(new URL(ownArea, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/resident/:path*",
    "/admin/:path*",
    "/employee/:path*",
    "/volunteer/:path*",
    "/profile/:path*",
  ],
};