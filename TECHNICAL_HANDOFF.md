# CleanLoop Web: Technical Handoff

This document is a source-anchored implementation handoff for the current `main` branch. The application is a Next.js 14.2.5 App Router project using React 18, Tailwind 3, MongoDB/Mongoose, JWT cookies, bcrypt, and Zod. There is no client state library, test script, or test suite.

## 1. UI and Design System

### Tailwind configuration

The complete Tailwind configuration is in [`tailwind.config.js`](tailwind.config.js):

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        loop: {
          50: "#F6F5EE", 100: "#F0EEE3", 200: "#E3E0D2",
          300: "#C7C2AC", 400: "#8FA396", 500: "#4B564F",
          700: "#24513B", 800: "#1A2318", 900: "#10160F", 950: "#0A0D09",
        },
        amber: { 400: "#EDB65C", 500: "#E2A33B", 600: "#C4841F" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(16,22,15,0.06), 0 12px 24px -12px rgba(16,22,15,0.18)",
        glow: "0 0 80px 0 rgba(226,163,59,0.25)",
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(60% 50% at 82% 100%, rgba(226,163,59,0.16) 0%, rgba(226,163,59,0) 60%), radial-gradient(80% 60% at 10% 0%, rgba(36,81,59,0.35) 0%, rgba(36,81,59,0) 55%)",
      },
      keyframes: {
        "loop-travel": { "0%": { offsetDistance: "0%" }, "100%": { offsetDistance: "100%" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "loop-travel": "loop-travel 9s linear infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [],
};
```

Fonts are loaded in [`src/app/layout.js`](src/app/layout.js): `Big_Shoulders_Display` for headings, `Inter` for body text, and `IBM_Plex_Mono` for data labels. There is no dark-mode class strategy, `next-themes`, or runtime theme switch. The visual theme is fixed.

### Complete `globals.css`

[`src/app/globals.css`](src/app/globals.css) is currently:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :focus-visible {
    outline: 2px solid theme("colors.amber.500");
    outline-offset: 2px;
    border-radius: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  h1, h2, h3 { font-family: var(--font-display); letter-spacing: -0.01em; }
}

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-[3px]
      bg-amber-500 px-5 py-2.5 text-sm font-semibold text-loop-900
      transition-colors duration-150 hover:bg-amber-400 focus-visible:bg-amber-400;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-[3px]
      border border-loop-300 bg-transparent px-5 py-2.5 text-sm font-semibold
      text-loop-900 transition-colors duration-150 hover:border-loop-500 hover:bg-loop-50;
  }
  .btn-secondary-on-dark {
    @apply inline-flex items-center justify-center gap-2 rounded-[3px]
      border border-white/20 bg-transparent px-5 py-2.5 text-sm font-semibold
      text-loop-50 transition-colors duration-150 hover:border-white/40 hover:bg-white/5;
  }
  .card { @apply rounded-[3px] border border-loop-200 bg-loop-50 p-6 shadow-card; }
  .badge { @apply inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em]; }
  .manifest-label { @apply font-mono text-[11px] uppercase tracking-[0.22em] text-loop-400; }
}

@layer utilities {
  .grain::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.05;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  }
  .text-balance { text-wrap: balance; }
}
```

There are no CSS definitions for `bg-sand`, `bg-clay-500`, `text-clay-600`, `field-label`, or `field-input`, although the JSX uses them. The modal's local style defines `.input`, but its JSX uses `.field-input`, so that local style does not apply.

### Shared components

#### `Navbar`

[`src/components/Navbar.js`](src/components/Navbar.js) receives `{ user, title }`. The server layout obtains `user` and passes it down; the client component only owns logout navigation.

```jsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Navbar({ user, title }) {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login"); router.refresh();
  }
  return <header className="flex items-center justify-between border-b border-loop-100 bg-white px-6 py-4 md:px-10">
    <div><p className="text-xs uppercase tracking-wide text-loop-500">CleanLoop</p><h1 className="font-display text-lg font-semibold text-loop-950">{title}</h1></div>
    <div className="flex items-center gap-4">{user && <Link href="/profile" className="text-sm text-loop-700 hover:underline">{user.name} &middot; <span className="capitalize">{user.role}</span></Link>}<button onClick={handleLogout} className="btn-secondary">Log out</button></div>
  </header>;
}
```

#### `StatusBadge`

[`src/components/StatusBadge.js`](src/components/StatusBadge.js) accepts only `status`, maps it to a class and human label, and falls back to the raw status.

```jsx
const STYLES = { open: "bg-clay-500/15 text-clay-600", in_progress: "bg-loop-100 text-loop-700", resolved: "bg-loop-700/15 text-loop-700" };
const LABELS = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || "bg-loop-100 text-loop-700"}`}>{LABELS[status] || status}</span>;
}
```

#### `CleanLoopLogo`

[`src/components/CleanLoopLogo.js`](src/components/CleanLoopLogo.js) accepts `variant` (`lockup` or `mark`), `tone` (`dark` or `light`), `size`, and `className`. It renders an SVG mark and conditionally renders the wordmark:

```jsx
<span className={`inline-flex items-center gap-2.5 ${className}`}>
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="CleanLoop">
    <defs><linearGradient id="cl-mark-grad" x1="4" y1="6" x2="36" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#24513B" /><stop offset="1" stopColor="#E2A33B" /></linearGradient></defs>
    <path d="M20 5.5 A14.5 14.5 0 1 1 8.2 28.4" stroke="url(#cl-mark-grad)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    <path d="M8.2 28.4 L6.6 21.7 L13 24.6 Z" fill="#E2A33B" />
    <circle cx="20" cy="5.5" r="3.1" fill="#10160F" /><circle cx="20" cy="5.5" r="1.35" fill="#F6F5EE" />
  </svg>
  {variant === "lockup" && <span className="font-display text-[1.35rem] font-bold leading-none tracking-tight" style={{ color: wordmarkColor }}>Clean<span style={{ color: "#E2A33B" }}>Loop</span></span>}
</span>
```

#### `Reveal`

[`src/components/Reveal.js`](src/components/Reveal.js) exposes `useInView({ threshold, rootMargin })`, returning `[ref, inView]`. `Reveal({ children, delay, className })` uses `IntersectionObserver`, observes once, immediately reveals for reduced motion, and toggles `animate-fade-up` versus `opacity-0`.

```jsx
export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return <div ref={ref} className={`${inView ? "animate-fade-up" : "opacity-0"} ${className}`} style={{ animationDelay: inView ? `${delay}ms` : undefined }}>{children}</div>;
}
```

#### `RouteMap`

[`src/components/RouteMap.js`](src/components/RouteMap.js) accepts only `className`. It renders a fixed 520x420 SVG, maps four `STOPS` objects to circles and labels, and overlays a plain div whose CSS `offsetPath` is the same route string:

```jsx
export default function RouteMap({ className = "" }) {
  return <div className={`relative ${className}`} style={{ width: 520, height: 420, maxWidth: "100%" }} aria-hidden="true">
    <svg width="520" height="420" viewBox="0 0 520 420" style={{ width: "100%", height: "100%" }}>
      <defs><linearGradient id="route-grad" x1="55" y1="45" x2="440" y2="335" gradientUnits="userSpaceOnUse">...</linearGradient></defs>
      <path d={ROUTE_D} fill="none" stroke="url(#route-grad)" strokeWidth="1.5" opacity="0.9" />
      <path d={ROUTE_D} fill="none" stroke="#F6F5EE" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="1 7" />
      {STOPS.map((s) => <g key={s.code}><circle cx={s.x} cy={s.y} r="5.5" fill="#10160F" stroke="#E2A33B" strokeWidth="1.5" /><text x={s.x + s.dx} y={s.y + s.dy}>{s.code}</text><text x={s.x + s.dx} y={s.y + s.dy + 13}>{s.role}</text></g>)}
    </svg>
    <div className="absolute left-0 top-0 h-3 w-3 animate-loop-travel" style={{ offsetPath: `path("${ROUTE_D}")`, offsetRotate: "0deg" }}><span className="block h-3 w-3 rounded-full bg-amber-500 shadow-glow" /></div>
  </div>;
}
```

#### Resource components

[`src/components/admin/ResourceManager.js`](src/components/admin/ResourceManager.js) owns resources, loading/error, category/status/search filters, and modal state. It debounces only search by 350ms; category/status fetch immediately. It has loading, error, empty, table, edit, delete, and modal branches. `handleSaved` replaces or prepends the saved row without a full refetch.

[`src/components/admin/ResourceFormModal.js`](src/components/admin/ResourceFormModal.js) receives `{ target, onClose, onSaved }`. `target === null` is create mode; an object is edit mode. Its central implementation is:

```jsx
const META_FIELDS = {
  bin: [{ key: "capacity", label: "Capacity", placeholder: "e.g. 120L" }],
  truck: [{ key: "plate", label: "Plate number", placeholder: "e.g. WP-CAB-4021" }, { key: "fuelType", label: "Fuel type", placeholder: "e.g. diesel" }],
  ppe: [{ key: "size", label: "Size", placeholder: "e.g. L" }, { key: "expiresAt", label: "Expires", placeholder: "YYYY-MM-DD" }],
  other: [],
};
function emptyForm() { return { name: "", category: "bin", identifier: "", status: "active", condition: "good", quantity: 1, zone: "", lastServicedAt: "", notes: "", meta: {} }; }
export default function ResourceFormModal({ target, onClose, onSaved }) {
  const isEdit = Boolean(target);
  const [form, setForm] = useState(() => !target ? emptyForm() : { name: target.name || "", category: target.category || "bin", identifier: target.identifier || "", status: target.status || "active", condition: target.condition || "good", quantity: target.quantity ?? 1, zone: target.zone || "", lastServicedAt: target.lastServicedAt ? target.lastServicedAt.slice(0, 10) : "", notes: target.notes || "", meta: target.meta || {} });
  const [saving, setSaving] = useState(false), [error, setError] = useState("");
  function update(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }
  function updateMeta(key, value) { setForm((prev) => ({ ...prev, meta: { ...prev.meta, [key]: value } })); }
  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setError("");
    const url = isEdit ? `/api/admin/resources/${target._id}` : "/api/admin/resources";
    const method = isEdit ? "PATCH" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) || 0, lastServicedAt: form.lastServicedAt || null }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Save failed"); onSaved(data.resource);
    } catch (err) { console.error("ResourceFormModal submit error:", err); setError(err.message); }
    finally { setSaving(false); }
  }
  const metaFields = META_FIELDS[form.category] || [];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-loop-950/50 p-4" onClick={onClose}>
    <div className="w-full max-w-lg rounded-[3px] bg-loop-50 p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between"><h2>{isEdit ? "Edit resource" : "Add resource"}</h2><button type="button" onClick={onClose} aria-label="Close">✕</button></div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4"><div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className="field-input" /></Field>
        <Field label="Category" required><select value={form.category} onChange={(e) => update("category", e.target.value)} className="field-input"><option value="bin">Bin</option><option value="truck">Truck</option><option value="ppe">PPE</option><option value="other">Other</option></select></Field>
        <Field label="ID / Tag"><input type="text" value={form.identifier} onChange={(e) => update("identifier", e.target.value)} className="field-input" placeholder="Asset tag / serial" /></Field>
        <Field label="Quantity"><input type="number" min="0" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="field-input" /></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => update("status", e.target.value)} className="field-input"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option><option value="out_of_stock">Out of stock</option></select></Field>
        <Field label="Condition"><select value={form.condition} onChange={(e) => update("condition", e.target.value)} className="field-input"><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></Field>
        <Field label="Zone"><input type="text" value={form.zone} onChange={(e) => update("zone", e.target.value)} className="field-input" placeholder="e.g. Zone 3 — Elm St" /></Field>
        <Field label="Last serviced"><input type="date" value={form.lastServicedAt} onChange={(e) => update("lastServicedAt", e.target.value)} className="field-input" /></Field>
        {metaFields.map((f) => <Field key={f.key} label={f.label}><input type="text" value={form.meta[f.key] || ""} onChange={(e) => updateMeta(f.key, e.target.value)} className="field-input" placeholder={f.placeholder} /></Field>)}
      </div><Field label="Notes"><textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="field-input min-h-[72px] resize-y" /></Field>
      {error && <p className="text-sm text-red-600">{error}</p>}<div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">{saving ? "Saving…" : isEdit ? "Save changes" : "Add resource"}</button></div></form>
    </div>
  </div>;
}
function Field({ label, required, children }) { return <label className="block"><span className="field-label">{label}{required && <span className="text-red-500"> *</span>}</span>{children}</label>; }
```

The linked source contains the complete repeated input list and the unused local `.input` style block.

### Responsive behavior

The explicit breakpoint usage is mostly `md:px-10`; layouts use `max-w-4xl`/`max-w-5xl` and `px-6`. Forms use fixed `grid-cols-2` without a mobile override. Resource tables use `min-w-[720px]` inside `overflow-x-auto`. `RouteMap` is fixed at 520px with `maxWidth: "100%"`.

### Full resident page

[`src/app/resident/page.js`](src/app/resident/page.js) is a client component. It fetches schedules and complaints in parallel on mount, shows empty states, and has submit/error state only for the complaint form. It has no initial loading state or catch around `Promise.all`.

```jsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
const TYPE_LABELS = { missed_collection: "Missed collection", illegal_dumping: "Illegal dumping", hazard: "Hazard", other: "Other" };
export default function ResidentPage() {
  const [schedules, setSchedules] = useState([]), [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ type: "missed_collection", description: "" });
  const [submitting, setSubmitting] = useState(false), [error, setError] = useState("");
  async function loadData() { const [scheduleRes, complaintRes] = await Promise.all([fetch("/api/schedules"), fetch("/api/complaints")]); const scheduleData = await scheduleRes.json(), complaintData = await complaintRes.json(); setSchedules(scheduleData.schedules || []); setComplaints(complaintData.complaints || []); }
  useEffect(() => { loadData(); }, []);
  async function handleSubmit(e) { e.preventDefault(); setError(""); setSubmitting(true); const res = await fetch("/api/complaints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await res.json(); setSubmitting(false); if (!res.ok) { setError(data.error || "Could not submit report"); return; } setForm({ type: "missed_collection", description: "" }); loadData(); }
  return <div className="space-y-8"><section><h2>Your collection schedule</h2>{schedules.length === 0 ? <p className="card">No schedule has been published for your zone yet. Check back soon.</p> : <div className="card divide-y divide-loop-100">{schedules.map((s) => <div key={s._id} className="flex justify-between py-2"><span>{s.dayOfWeek}</span><span>{s.wasteType}</span></div>)}</div>}</section><section><h2>Report an issue</h2><form onSubmit={handleSubmit} className="card space-y-4"><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><textarea required minLength={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />{error && <p>{error}</p>}<button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit report"}</button></form></section><section><div className="flex items-center justify-between"><h2>Your reports</h2><Link href="/resident/complaints">View all</Link></div><div className="space-y-3">{complaints.slice(0, 3).map((c) => <div key={c._id} className="card flex items-start justify-between"><div><p>{TYPE_LABELS[c.type]}</p><p>{c.description}</p></div><StatusBadge status={c.status} /></div>)}{complaints.length === 0 && <p className="card">No reports submitted yet.</p>}</div></section></div>;
}
```

## 2. State and Data Flow

There is no Redux, Zustand, SWR, React Query, or context provider. Pages and components use `useState`, `useEffect`, `useCallback`, and plain browser `fetch`. Role layouts are server components and call `getCurrentUser()`, then pass the safe user object to `Navbar`; login/register use `data.user.role` to choose a destination. Middleware independently verifies the JWT role before protected pages render.

`ResourceManager` has loading/error/empty branches. Login/register catch network failures. Resident, employee, volunteer, and admin dashboards generally show empty states but no loading state and often do not check `res.ok` or catch fetch failures. There are no `loading.js`, `error.js`, or `global-error.js` files.

## 3. Forms and Validation

Zod schemas are route-local, not shared with the client:

```js
// complaints
z.object({ type: z.enum(["missed_collection", "illegal_dumping", "hazard", "other"]), description: z.string().trim().min(5).max(1000), zone: z.string().trim().max(80).optional().nullable() })
// schedules
z.object({ zone: z.string().trim().min(1).max(80), dayOfWeek: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]), wasteType: z.enum(["general", "recycling", "organic"]).default("general") })
// routes
z.object({ zone: z.string().trim().min(1).max(80), date: z.coerce.date(), assignedTo: z.string().min(1), stops: z.array(z.string().trim().min(1)).min(1) })
// campaigns
z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().max(1000).optional().default(""), zone: z.string().trim().max(80).optional().nullable(), date: z.coerce.date() })
// resource: no Zod schema; POST manually checks name/category and Mongoose validates the rest.
```

Complaint/schedule/route/campaign forms rely on HTML constraints and server validation. Register flattens `data.details` into text. Resource modal shows one server error string. There are no client-side Zod schemas or field-level error rendering.

## 4. Auth and Middleware Internals

[`src/middleware.js`](src/middleware.js) verifies the cookie with `jose.jwtVerify`, redirects unauthenticated protected paths to `/login?next=...`, and redirects an authenticated user from another role area to `ROLE_HOME[role]`. `/profile` is shared. The matcher covers `/resident`, `/admin`, `/employee`, `/volunteer`, and `/profile`.

[`src/lib/requireUser.js`](src/lib/requireUser.js) calls `getSessionFromCookies()` and returns 401 `{ error: "Not authenticated" }`, 403 `{ error: "Not authorized" }`, or the decoded `{ sub, role }` session.

Cookie lifecycle in [`src/lib/auth.js`](src/lib/auth.js):

```js
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "cleanloop_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 8;
export function signToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS }); }
export function verifyToken(token) { try { return jwt.verify(token, JWT_SECRET); } catch { return null; } }
export function buildAuthCookie(token) { return { name: COOKIE_NAME, value: token, httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TOKEN_TTL_SECONDS }; }
export function buildLogoutCookie() { return { name: COOKIE_NAME, value: "", httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 }; }
export function getSessionFromCookies() { const token = cookies().get(COOKIE_NAME)?.value; return token ? verifyToken(token) : null; }
```

Login/register sign `{ sub: user._id.toString(), role: user.role }` and call `res.cookies.set(cookie.name, cookie.value, cookie)`. Logout sets the same cookie with `maxAge: 0`. Password changes do not invalidate existing JWTs.

## 5. Representative API Implementations

### GET: complaints

```js
export async function GET() {
  const session = requireUser(["resident", "employee", "admin"]);
  if (session instanceof NextResponse) return session;
  await dbConnect();
  const query = session.role === "admin" ? {} : { reportedBy: session.sub };
  const complaints = await Complaint.find(query).sort({ createdAt: -1 }).populate("reportedBy", "name role").lean();
  return NextResponse.json({ complaints });
}
```

### POST: complaints

```js
export async function POST(request) {
  const session = requireUser(["resident", "employee"]);
  if (session instanceof NextResponse) return session;
  const body = await request.json();
  const parsed = CreateComplaintSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  await dbConnect();
  const complaint = await Complaint.create({ ...parsed.data, source: session.role === "employee" ? "employee" : "resident", reportedBy: session.sub });
  return NextResponse.json({ complaint }, { status: 201 });
}
```

### PATCH: resource

```js
export async function PATCH(request, { params }) {
  const session = requireUser(["admin"]);
  if (session instanceof NextResponse) return session;
  await dbConnect();
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  try {
    const resource = await Resource.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    return NextResponse.json({ resource });
  } catch (err) {
    if (err.name === "ValidationError") return NextResponse.json({ error: err.message }, { status: 400 });
    if (err.name === "CastError") return NextResponse.json({ error: "Invalid resource id" }, { status: 400 });
    console.error("PATCH /api/admin/resources/:id error:", err);
    return NextResponse.json({ error: "Could not update resource" }, { status: 500 });
  }
}
```

Success shapes are `{ complaints }`, `{ complaint }`, `{ resource }`, etc. Protected failures use `{ error }`; some Zod routes add `{ details: fieldErrors }`. Statuses include 200, 201, 400, 401, 403, 404, 409, 429, and 500. Consistency is incomplete: malformed JSON is caught for auth/resources but not campaigns/complaints/routes/schedules; invalid IDs are normalized for resources but not all other IDs; several database failures escape without the normal `{ error }` envelope.

## 6. Database Layer

[`src/lib/dbConnect.js`](src/lib/dbConnect.js) stores `{ conn, promise }` on `global._mongooseCache`, returns an existing connection, shares an in-flight promise, resets the promise after failure, and uses `bufferCommands: false`.

Full Complaint model:

```js
import mongoose from "mongoose";
const ComplaintSchema = new mongoose.Schema({
  type: { type: String, enum: ["missed_collection", "illegal_dumping", "hazard", "other"], required: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  zone: { type: String, trim: true, default: null },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  source: { type: String, enum: ["resident", "employee"], required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });
export default mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
```

There are no Complaint indexes or pre/post hooks. Resource has indexes `{ category: 1, status: 1 }` and text `{ name: "text", identifier: "text" }`. All models use the hot-reload-safe model reuse pattern.

## 7. Source Tree

```text
src/
├── middleware.js
├── app/
│   ├── globals.css
│   ├── layout.js
│   ├── page.js
│   ├── admin/{layout.js,page.js,resources/page.js}
│   ├── api/{admin/resources/route.js,admin/resources/[id]/route.js,auth/{login,logout,me,password,profile,register}/route.js,campaigns/route.js,complaints/route.js,complaints/[id]/route.js,routes/route.js,routes/[id]/route.js,schedules/route.js}
│   ├── employee/{layout.js,page.js}
│   ├── login/page.js
│   ├── profile/{layout.js,page.js}
│   ├── register/page.js
│   ├── resident/{layout.js,page.js,complaints/page.js}
│   └── volunteer/{layout.js,page.js}
├── components/{CleanLoopLogo.js,icons.js,Navbar.js,ProfileManager.js,Reveal.js,RouteMap.js,StatusBadge.js}
│   └── admin/{ResourceFormModal.js,ResourceManager.js}
└── lib/{auth.js,dbConnect.js,getCurrentUser.js,requireUser.js,models/{Campaign.js,Complaint.js,Resource.js,Route.js,Schedule.js,User.js}}
```

## 8. Known Issues and Refactoring Targets

No `TODO` or `FIXME` comments were found. `console.error` exists in resource GET/POST/PATCH/DELETE, auth login/register/password/profile, and both resource client components. There is no centralized logger or request correlation.

1. Public registration accepts every `ROLE_VALUES` entry, including `admin`; the registration UI exposes those choices.
2. Resource PATCH passes the entire body to `findByIdAndUpdate`, allowing mutation of server-owned fields such as `createdBy` and `assignedTo`.
3. Login passes the `next` query parameter directly to `router.push(next)` and should restrict it to an internal path.
4. `bg-sand`, `clay-*`, `field-label`, and `field-input` are referenced but not defined, affecting visual styling.
5. Resident loading has no catch/loading state; employee/volunteer loads silently fail; admin complaint operations ignore failures; volunteer submission can leave `submitting` true on network failure; logout ignores failure.
6. Several API handlers do not catch malformed JSON or database exceptions, so errors can bypass the documented JSON envelope.
7. Login throttling is process-local memory and does not coordinate across instances or survive restart.
8. Password changes do not invalidate already-issued JWTs.
9. There are no automated tests or `test` npm script. README is stale relative to resource/profile additions.

The main duplication is the repeated dashboard `useEffect`/`fetch`/JSON pattern, repeated role-home maps, and repeated status/category label maps. A shared API client, async-state hook, and centralized constants would improve consistency.

Recommended first fixes: add the missing design tokens/field utilities; restrict registration roles and sanitize redirects; whitelist resource PATCH fields; add route-level error/loading boundaries and consistent API envelopes; then add authorization, validation, cookie-lifecycle, mutation, and dashboard-state tests.