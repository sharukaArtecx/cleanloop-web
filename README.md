# CleanLoop — Web App (Sprint 0–2)

A Next.js (JavaScript, App Router) + MongoDB + Tailwind CSS implementation of
CleanLoop, covering the increment reached by the end of Sprint 2: secure
role-based auth with login redirection, and one working vertical slice per
persona (Resident, Operations Admin, Collection Employee, Community
Volunteer), including the Sprint 2 cross-module link between an employee's
hazard report and the admin's complaint queue.

## Folder structure

```
cleanloop-web/
├── .env.local.example        # copy to .env.local and fill in
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json             # @/ path alias -> src/
├── scripts/
│   └── seed.js                # creates one demo user per role
└── src/
    ├── middleware.js          # role-based route protection + redirects
    ├── lib/
    │   ├── dbConnect.js        # cached Mongoose connection
    │   ├── auth.js             # hashing, JWT, secure cookie helpers
    │   ├── requireUser.js      # API route auth/role guard
    │   ├── getCurrentUser.js   # server component helper
    │   └── models/
    │       ├── User.js
    │       ├── Complaint.js
    │       ├── Schedule.js
    │       ├── Route.js
    │       └── Campaign.js
    ├── components/
    │   ├── Navbar.js
    │   └── StatusBadge.js
    └── app/
        ├── layout.js
        ├── globals.css
        ├── page.js             # landing page
        ├── login/page.js
        ├── register/page.js
        ├── resident/
        │   ├── layout.js
        │   ├── page.js          # schedule view + report issue
        │   └── complaints/page.js
        ├── admin/
        │   ├── layout.js
        │   └── page.js          # complaint queue + schedule publisher
        ├── employee/
        │   ├── layout.js
        │   └── page.js          # route/stops + hazard flag
        ├── volunteer/
        │   ├── layout.js
        │   └── page.js          # campaign creation + list
        └── api/
            ├── auth/{register,login,logout,me}/route.js
            ├── complaints/route.js
            ├── complaints/[id]/route.js
            ├── schedules/route.js
            ├── routes/route.js
            ├── routes/[id]/route.js
            └── campaigns/route.js
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a free MongoDB Atlas cluster** (atlas.mongodb.com), then copy the
   connection string.

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local`:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — generate a long random value:
     ```bash
     openssl rand -base64 48
     ```

4. **Seed demo accounts** (optional but recommended for the Sprint Review demo)
   ```bash
   npm run seed
   ```
   Creates one login per role, all using password `Password123`:
   | Role      | Email                     |
   |-----------|---------------------------|
   | Resident  | resident@cleanloop.test   |
   | Admin     | admin@cleanloop.test      |
   | Employee  | employee@cleanloop.test   |
   | Volunteer | volunteer@cleanloop.test  |

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Security notes (for your report's Data/Privacy/Security section)

- Passwords are hashed with **bcrypt** (10 salt rounds) — plaintext is never stored.
- Sessions use a **JWT in an httpOnly cookie** (`sameSite=strict`, `secure` in
  production) — inaccessible to client-side JS, mitigating XSS token theft,
  and not sent cross-site, mitigating CSRF.
- Login responses use **generic error messages** ("Invalid email or
  password") so the form can't be used to enumerate registered emails.
- A simple **in-memory rate limiter** throttles repeated failed logins per
  email (5 attempts / 10 minutes) — swap for Redis/Upstash before any real
  production deployment.
- All input is validated server-side with **zod** before touching the
  database, on both auth and domain routes.
- **Role-based access control** is enforced twice: `middleware.js` blocks
  page access by role, and `requireUser()` blocks API access by role — so a
  resident can't call the admin's schedule-publish endpoint even if they
  guess the URL.

## What's NOT included (by design, matches "Out of Scope")

- Payment processing, legacy municipal system integration, IoT/hardware
  (smart bins, GPS trackers), multi-ward/citywide deployment — all explicitly
  out of scope per the assignment brief.
- Push notifications (truck-arrival alerts) — flagged for Sprint 3+, since the
  brief lists this as a "Could have" beyond the Sprint 0–2 Must-haves.

## Next steps toward Sprint 3–4

- Wire the employee-reported hazard complaint to auto-notify the admin
  (currently it just appears in the shared queue on refresh — a WebSocket or
  polling layer would make this live).
- Add photo upload to complaint reports (Cloudinary, per the original
  proposal).
- Build out the drop-off locator / recycling guidance features.
