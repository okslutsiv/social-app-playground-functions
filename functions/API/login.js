const { clientAuth } = require("../utils/firebase");
const { validateLoginData } = require("../utils/validators");
const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  const user = {
    email: req.body.email.trim(),
    password: req.body.password.trim(),
  };

  const { valid, errors } = validateLoginData(user);
  if (!valid) {
    throw res.status(400).json({ error: "Your data is invalid", errors });
  }
  return clientAuth
    .signInWithEmailAndPassword(user.email, user.password)
    .then(userCredential => userCredential.user.getIdToken())
    .then(token => res.json({ token }))
    .catch(err => {
      console.error(`${err.code}:  ${err.message}`);
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-email"
      )
        return res
          .status(403)
          .json({ error: "Wrong credentials, try once more" });
      return res.status(400).json({ error: err.message });
    });
});

module.exports = router;
