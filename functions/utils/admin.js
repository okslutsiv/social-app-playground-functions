const admin = require("firebase-admin");

// Configure  Firebase Admin SDK.
// It will be used to authenticate multiple Firebase features programmatically via the unified Admin SDK
serviceAccount = require("../social-app-auth.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// admin.initializeApp();

const db = admin.firestore();
const serverAuth = admin.auth();

module.exports = {
  admin,
  db,
  serverAuth
};