"use client";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function ConfigBanner() {
  if (isFirebaseConfigured) return null;
  return (
    <div className="config-banner">
      <strong>Setup needed:</strong> Firebase is not configured. Add the <code>NEXT_PUBLIC_FIREBASE_*</code> variables to{" "}
      <code>.env.local</code> (local) or Vercel → Settings → Environment Variables, then restart / redeploy. See DEMO_GUIDE.md.
    </div>
  );
}
