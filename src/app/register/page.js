"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLE_HOME = {
  resident: "/resident",
  admin: "/admin",
  employee: "/employee",
  volunteer: "/volunteer",
};

const ROLE_OPTIONS = [
  { value: "resident", label: "Resident" },
  { value: "admin", label: "Operations / Scheduling Admin" },
  { value: "employee", label: "Collection Crew" },
  { value: "volunteer", label: "Community Volunteer" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "resident",
    zone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        const detailMsg = data.details
          ? Object.values(data.details).flat().join(" ")
          : "";
        setError(data.error + (detailMsg ? ` ${detailMsg}` : ""));
        setLoading(false);
        return;
      }

      router.push(ROLE_HOME[data.user.role] || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-loop-950 px-4 py-10">
      <div className="card w-full max-w-sm">
        <h1 className="font-display text-xl font-semibold text-loop-950">
          Create your CleanLoop account
        </h1>
        <p className="mt-1 text-sm text-loop-700">
          Choose the role that matches how you'll use the platform.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="field-label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              required
              className="field-input"
              value={form.name}
              onChange={update("name")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field-input"
              value={form.email}
              onChange={update("email")}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="field-input"
              value={form.password}
              onChange={update("password")}
            />
            <p className="mt-1 text-xs text-loop-500">
              At least 8 characters, including a letter and a number.
            </p>
          </div>
          <div>
            <label className="field-label" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="field-input"
              value={form.role}
              onChange={update("role")}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {form.role === "resident" && (
            <div>
              <label className="field-label" htmlFor="zone">
                Zone / ward
              </label>
              <input
                id="zone"
                placeholder="e.g. Ward 4"
                className="field-input"
                value={form.zone}
                onChange={update("zone")}
              />
            </div>
          )}

          {error && <p className="text-sm text-clay-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-loop-700">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-loop-900 underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
