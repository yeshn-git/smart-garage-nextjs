/* Home page (server component). Interactive parts come from components/Navbar.js */
import Link from "next/link";
import Navbar, { HeroButtons, CtaButton } from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><span className="dot" /> Cloud + AI Powered Service Centre</span>
            <h1>Smarter vehicle service with <span className="grad">AI diagnosis in the cloud</span></h1>
            <p className="lead">
              Describe your vehicle problem in plain words. Google Gemini AI suggests possible causes and safe first
              steps, while the garage team manages every request from one live cloud dashboard.
            </p>
            <HeroButtons />
            <div className="hero-badges">
              <span>▲ <b>Vercel</b> + Next.js</span>
              <span>🐘 <b>Postgres</b> Cloud DB</span>
              <span>✦ <b>Gemini</b> AI</span>
              <span>🔒 <b>Secure</b> Auth</span>
            </div>
          </div>

          <div className="hero-card" aria-label="Sample AI analysis preview">
            <div className="hc-head">
              <span className="hc-title">AI Vehicle Assistant</span>
              <span className="hc-chip">Sample output</span>
            </div>
            <div className="hc-label">Customer input</div>
            <div className="hc-input">&quot;Grinding noise when I brake, and the car pulls slightly to the left.&quot;</div>
            <div className="hc-label">Possible causes</div>
            <ul className="hc-list">
              <li><span>Worn brake pads</span><span>HIGH</span></li>
              <li><span>Scored / uneven brake disc</span><span>MEDIUM</span></li>
              <li><span>Sticking brake caliper</span><span>MEDIUM</span></li>
            </ul>
            <div className="hc-label">Recommendation</div>
            <div className="hc-input" style={{ marginBottom: 10 }}>Professional inspection recommended · High urgency</div>
            <p className="hc-foot">AI suggestions are preliminary and do not replace professional diagnosis.</p>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head reveal">
            <span className="tag">Features</span>
            <h2>Everything a modern garage needs</h2>
            <p>A cloud-hosted platform that connects customers, AI analysis and garage staff in real time.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/></svg></div>
              <h3>Gemini AI Diagnosis</h3>
              <p>Get possible causes, likelihood, troubleshooting steps and an inspection recommendation in seconds.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg></div>
              <h3>Cloud Postgres Database</h3>
              <p>All service requests and AI results are stored in a serverless Neon Postgres database and stay in sync across every device.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <h3>Secure Authentication</h3>
              <p>Hashed passwords, httpOnly session cookies and separate customer and admin access, checked on every API call.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
              <h3>Vehicle Image Upload</h3>
              <p>Attach a photo of a warning light or damage. It is stored in the cloud database and analysed by Gemini.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></div>
              <h3>Admin Dashboard</h3>
              <p>Garage staff view every request, AI urgency, customer details and live statistics in one place.</p>
            </div>
            <div className="feature-card reveal">
              <div className="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <h3>Live Status Tracking</h3>
              <p>Customers follow their request from Pending to In Progress to Completed without calling the garage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="section section-dark" id="how">
        <div className="container">
          <div className="section-head reveal">
            <span className="tag">Workflow</span>
            <h2>How it works</h2>
            <p>From problem description to completed service in four simple steps.</p>
          </div>
          <div className="steps">
            <div className="step reveal"><h3>Register &amp; log in</h3><p>Create an account with secure, hashed-password login.</p></div>
            <div className="step reveal"><h3>Describe the problem</h3><p>Enter brand, model, year, registration number, the issue and an optional photo.</p></div>
            <div className="step reveal"><h3>AI analyses it</h3><p>A secure Vercel serverless API sends the details to Google Gemini and returns a structured diagnosis.</p></div>
            <div className="step reveal"><h3>Garage takes over</h3><p>Staff review the request in the admin dashboard and update its status in real time.</p></div>
          </div>
        </div>
      </section>

      {/* ===== Architecture ===== */}
      <section className="section" id="architecture">
        <div className="container">
          <div className="section-head reveal">
            <span className="tag">Cloud Architecture</span>
            <h2>Built on Vercel, Neon Postgres &amp; Gemini</h2>
            <p>Serverless, scalable and secure — no servers to manage.</p>
          </div>
          <div className="arch-wrap reveal">
            <div className="arch-flow">
              <div className="arch-node"><strong>Customer</strong>Browser / Mobile</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node cloud"><strong>Next.js App</strong>Hosted on Vercel</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node cloud"><strong>Auth API</strong>bcrypt + JWT cookie</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node cloud"><strong>/api/analyze</strong>Vercel serverless</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node ai"><strong>Gemini AI</strong>Problem analysis</div>
              <div className="arch-arrow">→</div>
              <div className="arch-node cloud"><strong>Neon Postgres</strong>Requests + AI results</div>
            </div>
            <p className="arch-caption">The Gemini API key is a server-only Vercel environment variable used by /api/analyze. The browser never sees it.</p>
            <div className="tech-row">
              <span className="tech-pill">React · JavaScript</span>
              <span className="tech-pill">Next.js</span>
              <span className="tech-pill">Vercel</span>
              <span className="tech-pill">Secure Session Auth</span>
              <span className="tech-pill">Neon Serverless Postgres</span>
              <span className="tech-pill">Vercel Serverless Functions</span>
              <span className="tech-pill">Google Gemini API</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta reveal">
            <h2>Is your vehicle making a strange noise?</h2>
            <p>Get an instant AI-powered preliminary analysis and book a service in under two minutes.</p>
            <CtaButton />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} SmartGarage AI · Cloud Computing CAT-03 Case Study · Dayananda Sagar University</span>
          <span><Link href="/login">Staff Login</Link></span>
        </div>
      </footer>
    </>
  );
}
