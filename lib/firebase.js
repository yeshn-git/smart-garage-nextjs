/* =========================================================================
   lib/firebase.js - Firebase client SDK (browser only)

   Values come from environment variables (.env.local locally, and
   Vercel -> Settings -> Environment Variables in production).
   Firebase is initialised LAZILY (on first use in the browser) so that
   `next build` on Vercel never fails because of Firebase.

   The Firebase web config is not a secret. The GEMINI_API_KEY is secret and
   is only used in app/api/analyze/route.js on the server.
   ========================================================================= */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId &&
  !String(firebaseConfig.apiKey).startsWith("your-")
);

/** "firestore" (free Spark plan) or "storage" (Cloud Storage, Blaze plan) */
export const IMAGE_STORAGE_MODE =
  process.env.NEXT_PUBLIC_IMAGE_STORAGE === "storage" ? "storage" : "firestore";

function firebaseApp() {
  if (!isFirebaseConfigured) {
    throw Object.assign(new Error("Firebase is not configured. Add the NEXT_PUBLIC_FIREBASE_* environment variables."), {
      code: "app/not-configured"
    });
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const getFirebaseAuth = () => getAuth(firebaseApp());
export const getDb = () => getFirestore(firebaseApp());
export const getStorageClient = () => getStorage(firebaseApp());
