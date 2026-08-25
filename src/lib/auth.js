import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "cleanloop_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  throw new Error(
    "Missing or weak JWT_SECRET environment variable. Set a long random value in .env.local."
  );
}

/** Hash a plaintext password with bcrypt (10 salt rounds). */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/** Sign a short-lived JWT carrying only non-sensitive identity claims. */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

/** Verify a JWT; returns the decoded payload or null if invalid/expired. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Set the auth cookie on the response. httpOnly + sameSite=strict prevents
 * the token from being read by client-side JS or sent on cross-site requests
 * (mitigates XSS token theft and CSRF). Secure is enabled outside dev so the
 * cookie is only ever sent over HTTPS in production.
 */
export function buildAuthCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}

export function buildLogoutCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

/** Read + verify the current request's session from the auth cookie (server-side only). */
export function getSessionFromCookies() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
