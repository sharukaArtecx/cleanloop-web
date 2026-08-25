import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

/**
 * Guards an API route handler. Verifies the JWT cookie, then (optionally)
 * checks the caller's role is in `allowedRoles`. Returns a 401/403
 * NextResponse if the check fails, or the decoded session `{ sub, role }`
 * if it passes.
 *
 * Usage inside a route handler:
 *   const session = requireUser(allowedRoles);
 *   if (session instanceof NextResponse) return session;
 */
export function requireUser(allowedRoles = null) {
  const session = getSessionFromCookies();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return session;
}
