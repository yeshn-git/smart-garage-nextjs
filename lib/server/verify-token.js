/* =========================================================================
   lib/server/verify-token.js
   Verifies a Firebase Authentication ID token on the server WITHOUT a
   service-account key: the token's signature is checked against Google's
   public keys, and issuer / audience must match our Firebase project.
   (Same checks that firebase-admin's verifyIdToken performs.)
   ========================================================================= */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError } from "./errors.js";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function verifyFirebaseToken(authorizationHeader) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new ApiError(500, "not_configured", "NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set on the server.");

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader || "");
  if (!match) throw new ApiError(401, "unauthenticated", "Missing login token. Please log in.");

  try {
    const { payload } = await jwtVerify(match[1], JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"]
    });
    if (!payload.sub) throw new Error("no subject");
    return { uid: payload.sub, email: payload.email || "" };
  } catch {
    throw new ApiError(401, "unauthenticated", "Your session has expired. Please log in again.");
  }
}
