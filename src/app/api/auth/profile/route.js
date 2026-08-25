import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { requireUser } from "@/lib/requireUser";
import { verifyPassword } from "@/lib/auth";

// name and/or email — at least one must be present. currentPassword is only
// required when email is being changed (checked below, not in the schema,
// since it's conditional on which field changed).
const ProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(120).optional(),
    currentPassword: z.string().optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: "Nothing to update",
  });

/**
 * PATCH /api/auth/profile
 * Body: { name? } to rename, or { email, currentPassword } to change email.
 * Any authenticated role can hit this — it's scoped to the caller's own
 * account via session.sub, never an id in the URL/body.
 */
export async function PATCH(request) {
  const session = requireUser(); // no allowedRoles arg = any logged-in role
  if (session instanceof NextResponse) return session;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, currentPassword } = parsed.data;

  await dbConnect();

  // select("+passwordHash") because User.passwordHash is select:false by
  // default (see src/lib/models/User.js) — same pattern as the login route.
  const user = await User.findById(session.sub).select("+passwordHash");
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Email is treated as a sensitive field: changing it requires re-proving
  // the current password. This blocks the "attacker leaves your session
  // logged in, swaps the email to one they control, then resets the
  // password via email" account-takeover path.
  if (email && email !== user.email) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Enter your current password to change your email" },
        { status: 400 }
      );
    }
    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const existing = await User.findOne({ email, _id: { $ne: user._id } });
    if (existing) {
      // Generic-enough not to be a big enumeration risk here since the
      // caller is already authenticated — unlike the register route, which
      // deliberately obscures this.
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  try {
    await user.save();
  } catch (err) {
    if (err.name === "ValidationError") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err.code === 11000) {
      // Race-condition fallback if two requests slipped past the check above.
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    console.error("PATCH /api/auth/profile error:", err);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }

  return NextResponse.json({ user: user.toSafeJSON() });
}