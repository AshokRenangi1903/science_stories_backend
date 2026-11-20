import fs from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account file not found");
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
      });

export default firebaseApp;
