# Presentation: AI-Powered Smart Garage Management System Using Cloud Computing (Next.js on Vercel, Neon Postgres, Gemini)

Cloud Computing CAT-03 · Yeshwanth N · ENG24CS0552 · Section I

Suggested deck: **10 slides, about 7 minutes**. The live demo script is in `DEMO_GUIDE.md`, section 9.

---

## Slide 1: Title
- AI-Powered Smart Garage Management System Using Cloud Computing
- AI-enabled cloud platform: **Vercel + Neon Serverless Postgres + Google Gemini API**
- Name, USN, Section, Department of CSE, DSU

## Slide 2: Project introduction
- A cloud-hosted Next.js web application, deployed on Vercel, for automobile service centres.
- Customers describe vehicle problems online and get instant AI-generated preliminary troubleshooting.
- Garage staff manage all service requests from a real-time dashboard.

## Slide 3: Problem statement
- Service requests arrive by phone, walk-in and chat, then get noted on paper.
- Customers describe symptoms vaguely, so first-level diagnosis is slow.
- Safety-critical issues (brakes, overheating) are not prioritised systematically.
- Customers call repeatedly to ask about status. Records are hard to search.
- **Affected:** vehicle owners, service advisors, mechanics, garage managers.

## Slide 4: Objectives
1. Digitise service-request intake with structured vehicle data.
2. Use AI to suggest possible causes, safe first steps, urgency and the need for inspection.
3. Store all data securely in a cloud database with role-based access.
4. Give staff a live dashboard with statistics and status management.
5. Deploy on managed, scalable cloud services without managing any server.

## Slide 5: Technologies used
| Purpose | Technology |
|---|---|
| Frontend | Next.js 16 (React), JavaScript, CSS |
| Hosting | Vercel (edge network, HTTPS, Git auto-deploy) |
| Backend | Next.js API routes on Vercel Serverless Functions |
| Login & roles | bcrypt password hashing + signed JWT in httpOnly cookie |
| Database & images | Neon Serverless PostgreSQL (Vercel Marketplace) |
| AI | Google Gemini API (gemini-2.5-flash) |
| Secrets | Vercel Environment Variables (server-only: Gemini key, auth secret, DB URL) |

Cloud service models: **PaaS + FaaS** (Vercel), **DBaaS** (Neon), **AI as a service** (Gemini API).

## Slide 6: Architecture
Insert `diagrams/architecture-diagram.png`.
- **Input:** customer form (vehicle details, problem, photo)
- **Cloud platform:** Vercel (hosting + serverless API routes) with Neon from the Vercel Marketplace
- **AI processing:** /api/requests and /api/analyze (Vercel) → Gemini API → structured JSON
- **Database:** Neon PostgreSQL (users, service_requests, ai_usage)
- **Output:** customer dashboard (AI analysis, live status) and admin dashboard

Key point: all secrets are server-only Vercel environment variables; every API call checks the signed session cookie and the user role.

## Slide 7: Workflow
1. Customer registers or logs in (bcrypt-checked; session cookie set).
2. Enters vehicle details and problem, plus an optional photo (compressed in the browser).
3. POST /api/requests (Vercel serverless) validates input and checks the AI limit.
4. Gemini returns causes, steps, urgency and inspection advice as JSON.
5. Request + image + AI result saved in Neon PostgreSQL (status: Pending).
6. Admin dashboard lists all requests (auto-refresh every 10 s) → admin sets In Progress / Completed + note.
7. Customer dashboard shows the new status and note.

## Slide 8: Screenshots to capture
Take these from the **deployed** site (`https://<your-app>.vercel.app`):
1. Home page hero section (desktop)
2. Register page and Login page
3. Customer dashboard with the filled New Service Request form
4. Submit progress message ("Gemini AI is analysing...")
5. AI analysis modal: causes, steps, urgency, disclaimer
6. "My Service Requests" list with status tracker
7. AI Assistant page with a result
8. Admin dashboard: stats cards + status distribution
9. Admin requests table with filters
10. Admin View / Update modal
11. Customer dashboard after the status changes to In Progress (with the admin note)
12. Mobile view (Chrome DevTools device toolbar) of the home page and dashboard
13. Neon SQL Editor: `SELECT * FROM service_requests` and `users` (showing bcrypt hashes)
14. Vercel dashboard: successful deployment and function logs
15. Browser DevTools → Application → Cookies: the httpOnly `sg_session` cookie

## Slide 9: Expected outcomes
- Faster first-level diagnosis and better job prioritisation using AI urgency.
- Less manual work: no paper registers, automatic statistics, no status phone calls.
- Complete, searchable cloud records accessible from any device.
- Secure, scalable deployment that runs on free tiers (Vercel Hobby, Neon Free, Gemini free tier).
- **Limitations:** AI output is preliminary; it needs the internet; dashboards refresh every 10 s rather than instantly; no password-reset email yet; there is no OBD-II, billing or notifications yet.

## Slide 10: Conclusion
- Shows how cloud services (Vercel hosting and serverless functions, Neon serverless Postgres) and an AI API combine to solve a real garage problem.
- Secure by design: secrets on the server, hashed passwords, httpOnly sessions, role checks and parameterised SQL.
- **Future scope:** OBD-II integration, appointment slots, spare-parts inventory, online payments, SMS/WhatsApp alerts, multilingual (Kannada/Hindi) AI responses.
- Thank you. Questions?
