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

const PROTECTED_PREFIXES = ["/resident", "/admin", "/employee", "/volunteer"];

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
  const ownArea = ROLE_HOME[role];
  if (ownArea && !pathname.startsWith(ownArea)) {
    return NextResponse.redirect(new URL(ownArea, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/resident/:path*", "/admin/:path*", "/employee/:path*", "/volunteer/:path*"],
};
