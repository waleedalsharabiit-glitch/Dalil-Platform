import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FIREBASE_ADMIN_NOT_CONFIGURED");
  }

  const app = getApps().find((item) => item.name === "dalil-api") ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  }, "dalil-api");

  return getAuth(app);
}

export { getFirebaseAdminAuth };
