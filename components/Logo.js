import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="brand">
      <span className="brand-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
        </svg>
      </span>
      <span>Smart<em>Garage</em> AI</span>
    </Link>
  );
}
