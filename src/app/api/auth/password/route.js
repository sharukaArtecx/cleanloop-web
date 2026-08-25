import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { requireUser } from "@/lib/requireUser";
import { verifyPassword, hashPassword } from "@/lib/auth";

// Same complexity rule as registration (src/app/api/auth/register/route.js):
// 8+ chars, at least one letter and one number.
const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Za-z]/, "New password must include a letter")
      .regex(/[0-9]/, "New password must include a number"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

/**
 * PATCH /api/auth/password
 * Body: { currentPassword, newPassword }
 *
 * Note on scope: this rotates the hash for the caller's own account and
 * stamps passwordChangedAt, but does NOT invalidate other active JWT
 * sessions/devices — this app's auth is stateless (see src/lib/auth.js),
 * so there's no session table to revoke against. Other logged-in devices
 * stay valid until their existing token naturally expires (8h, see
 * TOKEN_TTL_SECONDS in src/lib/auth.js). Cross-device revocation would
 * need a tokenVersion field checked on every request — a real perf/arch
 * trade-off, flagged as a Sprint 3+ item rather than done silently here.
 */
export async function PATCH(request) {
  const session = requireUser();
  if (session instanceof NextResponse) return session;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  await dbConnect();
  const user = await User.findById(session.sub).select("+passwordHash");
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();

  try {
    await user.save();
  } catch (err) {
    console.error("PATCH /api/auth/password error:", err);
    return NextResponse.json({ error: "Could not update password" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, passwordChangedAt: user.passwordChangedAt });
}