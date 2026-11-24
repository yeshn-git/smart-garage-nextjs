# DEMO GUIDE: SmartGarage AI (Next.js on Vercel + Neon Postgres + Gemini)

This version needs **no Firebase**. Everything runs on **Vercel**:
- the website and API routes run on Vercel,
- the database is **Neon Postgres**, created from inside Vercel,
- the AI is the **Google Gemini API**.

> 💰 All of it fits the free plans: Vercel Hobby, Neon Free and the Gemini free tier. No credit card is needed.
> ⏱ Setup takes about 20–30 minutes.

---

## 0. Fix for the "404: NOT_FOUND" page on Vercel

That grey Vercel 404 means Vercel could not find the Next.js app in your repository. Almost always, `package.json` is inside a sub-folder instead of at the repository root.

✅ Your GitHub repository must look like this at the **top level**:
```
app/  components/  lib/  public/  package.json  next.config.mjs  vercel.json ...
```
❌ Not like this:
```
smart-garage-nextjs/
   └── app/  package.json ...
```

If yours is nested, do either of these:
- **Easiest:** Vercel → Project → **Settings → Build and Deployment → Root Directory → Edit** → select the inner folder → Save.
- **Or:** move the files up to the repository root, then commit and push.

Also check that **Framework Preset = Next.js** (the included `vercel.json` sets this). Then go to **Deployments → ⋯ → Redeploy**. In the build log you should see a route table that lists `/`, `/dashboard`, `/admin` and `/api/...`.

---

## 1. Install the required software

| Software | Download |
|---|---|
| Node.js 22 LTS (20.9+) | https://nodejs.org |
| Git | https://git-scm.com/download/win |
| VS Code | https://code.visualstudio.com |
| GitHub and Vercel accounts | https://github.com · https://vercel.com (sign up with GitHub) |

Check the installs in PowerShell:
```powershell
node -v
git --version
```
If PowerShell blocks scripts, run this once: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

---

## 2. Replace the old code in your GitHub repository

Your repository `smart-garage-nextjs` already exists, so replace its contents with this new version.

1. Unzip the new ZIP, e.g. to `C:\Projects\new\smart-garage-nextjs`.
2. Open your existing local repository folder (the one you pushed before). Delete everything in it **except the hidden `.git` folder**.
3. Copy **the contents** of the new `smart-garage-nextjs` folder (`app`, `components`, `package.json` …) into the repository folder, so `package.json` is at the top level.
4. Commit and push:
```powershell
cd C:\Projects\smart-garage-nextjs
git add -A
git commit -m "Switch to Vercel + Neon Postgres (no Firebase)"
git push
```

Starting fresh instead:
```powershell
cd C:\Projects\new\smart-garage-nextjs
git init
git add .
git commit -m "SmartGarage AI"
git branch -M main
git remote add origin https://github.com/<your-username>/smart-garage-nextjs.git
git push -u origin main
```

---

## 3. Create the Neon Postgres database (inside Vercel)

1. Open your project on Vercel → **Storage** tab → **Create Database** → choose **Neon (Serverless Postgres)** → **Continue**.
2. Accept the Neon terms. Choose the **Free** plan and region **Singapore (ap-southeast-1)**, which is closest to India.
3. Give it a name, e.g. `smart-garage-db`, then click **Create**. When it asks, **connect it to your project** (all environments).
4. Vercel automatically adds **`DATABASE_URL`** and a few related variables to your project.

You do **not** need to create any tables: the app creates them automatically on the first request. The SQL is also in `db/schema.sql` if you want to run it yourself in Neon's SQL Editor.

---

## 4. Add the other environment variables

**Vercel → Project → Settings → Environment Variables**. Add these for all environments:

| Name | Value |
|---|---|
| `AUTH_SECRET` | A random string of **at least 32 characters** (see below) |
| `ADMIN_EMAILS` | Admin email(s), e.g. `admin@test.com` (comma separated) |
| `GEMINI_API_KEY` | Your key from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-2.5-flash` |

`DATABASE_URL` is already there from step 3.

To generate `AUTH_SECRET`, run this in PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

None of these variables starts with `NEXT_PUBLIC_`, so all of them **stay on the server**. The browser never sees the Gemini key, the database password or the session secret.

Then go to **Deployments → ⋯ → Redeploy**. Variables only apply to new deployments.

**Admins:** any account whose email is listed in `ADMIN_EMAILS` becomes an admin when it registers or logs in. Register `admin@test.com` on the live site and you land on `/admin`.

---

## 5. Check the deployment

1. Open `https://<your-app>.vercel.app/api/analyze`. You should see:
   `{"ok":true, ..., "geminiConfigured":true, "databaseConfigured":true, "authConfigured":true}`
   Any `false` means that variable is missing. Add it, then redeploy.
2. Open the home page. Register a customer, submit a request, then register or log in with the admin email.

---

## 6. Run locally (optional)

```powershell
cd C:\Projects\smart-garage-nextjs
copy .env.example .env.local
notepad .env.local      # paste DATABASE_URL (Vercel → Settings → Environment Variables → DATABASE_URL → reveal),
                        # AUTH_SECRET, ADMIN_EMAILS, GEMINI_API_KEY
npm install
npm run dev             # http://localhost:3000
```
Other commands:
- `npm test` runs 12 unit tests.
- `npm run build` runs the same build Vercel runs.

Alternative: `npm i -g vercel`, then `vercel link` and `vercel env pull .env.local` downloads the variables automatically.

---

## 7. Test each feature

Use the inputs in `sample-data/test-cases.md`.

| # | Test | Expected |
|---|---|---|
| 1 | `/api/analyze` health check | All three `...Configured` are `true` |
| 2 | Open `/dashboard` while logged out | Redirect to `/login` |
| 3 | Register a customer | Lands on `/dashboard` |
| 4 | Duplicate email / wrong password | "already exists" / "Incorrect email or password" |
| 5 | Submit test case 1 with a photo | AI result modal with the image; card shows **Pending** |
| 6 | Invalid data (test case 7) | Validation warnings, nothing saved |
| 7 | `/ai-assistant` → example chip → Analyse | Causes, steps, urgency, disclaimer |
| 8 | "Book a Service Request with this Analysis" | Form pre-filled; saved without a second AI call |
| 9 | Customer opens `/admin` | "Admin access only" → back to `/dashboard` |
| 10 | Log in with the `ADMIN_EMAILS` account | `/admin` with all requests and stats |
| 11 | Admin → View / Update → In Progress + note | Customer dashboard shows it within 10 s, or immediately on refresh |
| 12 | Vercel → Storage → your Neon DB → **Open in Neon** → SQL Editor: `SELECT email, role FROM users;` | Users listed; passwords are stored only as bcrypt hashes |
| 13 | `curl.exe https://<app>.vercel.app/api/requests` (PowerShell) | **401**, which shows the API is protected |
| 14 | Vercel → Project → **Logs** | `request_created` / `ai_analysis` entries |

---

## 8. Demonstration script (≈ 7 minutes)

**Setup:**
- Window A: logged in as the customer.
- Window B (incognito): logged in as the admin.
- Tabs: the Vercel dashboard and the Neon SQL Editor.
- Keep `diagrams/architecture-diagram.png` ready.

| Time | Do | Say |
|---|---|---|
| 0:00 | Home page | "Garages still take requests on paper. My system uses cloud computing and AI: a Next.js app on Vercel, a Neon serverless Postgres database and Google Gemini." |
| 0:45 | Architecture diagram | "Vercel serves the site from its edge network and runs my API routes as serverless functions: login, service requests and AI analysis. Secrets like the Gemini key are server-only environment variables. Data is in Neon Postgres, connected through the Vercel Marketplace." |
| 1:45 | Window A → submit test case 1 with photo | "The customer enters the vehicle, problem and photo. The serverless function calls Gemini and saves everything in Postgres." |
| 2:45 | AI result | "Possible causes with likelihood, safe steps, urgency, inspection advice, and always a disclaimer." |
| 3:30 | Neon SQL Editor: `SELECT brand, status, ai_analysis->>'urgency' FROM service_requests;` | "Here is the same record in the cloud database." |
| 4:00 | Window B → /admin | "Staff see every request with statistics and AI urgency, so urgent brake jobs come first." |
| 4:45 | Update to In Progress + note → Window A | "The customer sees the new status and note without calling the garage." |
| 5:30 | /ai-assistant → Overheating | "Customers can also just ask the AI." |
| 6:00 | Vercel → Deployments / Logs | "Every git push deploys automatically; these are the serverless function logs." |
| 6:30 | Conclude | "Benefits: faster first diagnosis, less manual work, better prioritisation. Limitations: AI is preliminary, needs internet, no OBD integration yet." |

**Viva answers**
- **Why not call Gemini from the browser?** The key would be visible in the page source. It stays in a server-only Vercel environment variable.
- **How is login secured?** Passwords are hashed with bcrypt. Sessions are signed JWTs in httpOnly, SameSite cookies that JavaScript cannot read. Every API call re-checks the user and role in the database.
- **SQL injection?** All queries are parameterised (`$1, $2`).
- **Cloud service models?** Vercel is PaaS + FaaS (serverless functions). Neon is DBaaS. Gemini is AI consumed as an API (SaaS-style).
- **What is serverless?** There are no servers to manage. Functions run on demand and scale automatically, and Neon scales to zero when idle.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Vercel grey "404: NOT_FOUND" | Step 0: Root Directory / Framework Preset, then redeploy |
| "DATABASE_URL is not set" | Step 3: connect Neon to the project, then redeploy |
| "AUTH_SECRET is not set" | Step 4: add 32+ random characters, then redeploy |
| "GEMINI_API_KEY is not set" / "key is invalid" | Add or replace the key, then redeploy |
| "model not found" | Set `GEMINI_MODEL` to a current model (https://ai.google.dev/gemini-api/docs/models) |
| Admin email lands on `/dashboard` | Check the spelling in `ADMIN_EMAILS`, redeploy, then log out and in again |
| Request saved but "AI unavailable" | Gemini key, quota or model issue. The request is still stored and the admin can process it |
| Build fails | Open the build log; run `npm run build` locally |
| First request is slow | Neon wakes up from idle (a few seconds); this is normal on the free plan |
