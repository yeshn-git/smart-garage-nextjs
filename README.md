# AI-Powered Smart Garage Management System (Next.js · Vercel · Neon · Gemini)

Cloud Computing CAT-03 individual case study, Dayananda Sagar University.
**Student:** Yeshwanth N · **USN:** ENG24CS0552 · **Section:** I

Customers describe vehicle problems and get **Google Gemini** AI troubleshooting. Garage staff manage every request from an admin dashboard. Everything is deployed on **Vercel** with a **Neon serverless Postgres** database. **No Firebase.**

![Architecture](diagrams/architecture-diagram.png)

## Technology stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, JavaScript, CSS |
| Hosting | Vercel (edge network, HTTPS, auto-deploy from GitHub) |
| Backend | Next.js Route Handlers running as Vercel Serverless Functions |
| Database | Neon Serverless PostgreSQL (Vercel Marketplace), `@neondatabase/serverless` driver |
| Auth | Custom: bcrypt password hashing and a signed JWT (jose) in an httpOnly cookie |
| AI | Google Gemini API (`gemini-2.5-flash`, multimodal, JSON-schema output) |
| Secrets | Vercel environment variables (server-only) |

## API routes
| Route | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` · `login` · `logout`, `GET /api/auth/me` | anyone | Accounts and sessions |
| `GET /api/requests` | customer: own · admin: all | List requests |
| `POST /api/requests` | customer | Create a request; Gemini analysis runs server-side |
| `GET /api/requests/:id` | owner or admin | Request details including the image |
| `PATCH /api/requests/:id` | admin | Update status and note |
| `POST /api/analyze` · `GET` (health) | logged in | AI Assistant |

## Security
- Passwords are stored only as bcrypt hashes. Session cookies are httpOnly, SameSite=Lax and Secure.
- Every request re-loads the user and role from the database.
- All SQL is parameterised. APIs accept JSON only, which together with SameSite cookies blocks CSRF.
- AI limits: 5 calls per minute (in-memory) and 30 per day per user (stored in the database). Repeated failed logins are throttled.
- Secrets never reach the browser. React escapes all output, and security headers are set.

## Project structure
```
app/            pages (/, /login, /register, /dashboard, /ai-assistant, /admin) + api/ routes
components/     UI components and page views
lib/            client helpers (api.js, auth-context.js, utils.js)
lib/server/     db.js (Neon + auto schema), session.js, gemini.js, validate.js, rate-limit.js, http.js
db/schema.sql   database schema (also created automatically)
test/           unit tests (npm test)
diagrams/ documentation/ (report .docx + .pdf) sample-data/
.env.example  vercel.json  next.config.mjs  DEMO_GUIDE.md  PRESENTATION.md
```

## Quick start
1. Push this folder to GitHub so that `package.json` is at the **repository root**.
2. Import the repository at vercel.com/new.
3. In the Vercel project: **Storage → Create Database → Neon** (this adds `DATABASE_URL`).
4. Add `AUTH_SECRET`, `ADMIN_EMAILS`, `GEMINI_API_KEY` and `GEMINI_MODEL`, then **Redeploy**.

Full steps, including the 404 fix, are in **[DEMO_GUIDE.md](DEMO_GUIDE.md)**.

Local development:
```powershell
copy .env.example .env.local   # fill in values
npm install
npm run dev
```

## Verification status
- ✅ `npm run build` succeeds (Next.js 16.4), and `npm test` passes all 12 unit tests.
- ✅ All API routes were run against a **real PostgreSQL 16** database, with the Neon driver replaced by `pg` for local testing. Checked:
  - register, duplicate email, wrong password, bad cookie
  - CSRF form post blocked (415)
  - customer cannot PATCH (403), and another customer cannot read the request (404)
  - admin list and status update; the customer then sees the update
  - AI-failure fallback still saves the request; the daily AI counter increments
- ✅ Browser test of every page and flow against that server: photo upload, AI Assistant hand-off, admin role, status update, logout.
- ⚠️ In these tests Gemini was replaced by a **mock**. The real Gemini call and the real Neon/Vercel deployment have **not** been tested yet; they need your keys. Use the health check and the test table in DEMO_GUIDE.md.

## Disclaimer
AI suggestions are preliminary and do not replace a professional diagnosis by a qualified mechanic.
