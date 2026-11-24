import Link from "next/link";

export default function NotFound() {
  return (
    <div className="full-center" style={{ textAlign: "center" }}>
      <div>
        <h1 style={{ color: "var(--navy-900)" }}>404 — Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link href="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
