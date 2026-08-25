import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import User from "@/lib/models/User";
import { verifyPassword, signToken, buildAuthCookie } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// Minimal in-memory brute-force throttle, keyed by email. Good enough for a
// single-instance academic deployment; swap for Redis/Upstash in production.
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(key) {
  const record = attempts.get(key);
  if (!record) return false;
  if (Date.now() - record.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const record = attempts.get(key);
  if (!record || Date.now() - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: Date.now() });
  } else {
    record.count += 1;
  }
}

function clearFailures(key) {
  attempts.delete(key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const rateLimitKey = email.toLowerCase();

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email }).select("+passwordHash");

    // Same generic error whether the email doesn't exist or the password is
    // wrong — this prevents account enumeration via the login form.
    if (!user) {
      recordFailure(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailure(rateLimitKey);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    clearFailures(rateLimitKey);

    const token = signToken({ sub: user._id.toString(), role: user.role });
    const res = NextResponse.json({ user: user.toSafeJSON() }, { status: 200 });
    const cookie = buildAuthCookie(token);
    res.cookies.set(cookie.name, cookie.value, cookie);
    return res;
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
