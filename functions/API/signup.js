const { clientAuth } = require("../utils/firebase");
const { db } = require("../utils/admin");

const { validateSignUpData } = require("../utils/validators");
const { firebaseConfig } = require("../utils/config");

const express = require("express");

const router = express.Router();

// User's name should be unique

router.post("/", (req, res, next) => {
  const noAvatar = "no-avatar.png"; //default avatar
  const newUser = {
    userName: req.body.userName.trim(),
    email: req.body.email.trim(),
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
      firebaseConfig.storageBucket
    }/o/${noAvatar}?alt=media`,
  };

  const { valid, errors } = validateSignUpData(newUser);
  if (!valid) {
    console.log("------ invalid users data ------");
    throw res.status(400).json({ error: "The users data is invalid", errors });
  }

  let token = null;
  let userId = null;

  return db
    .doc(`/users/${newUser.userName}`)
    .get()
    .then(documentSnapshot => {
      console.log(
        `------- checking if user with name ${
          newUser.userName
        } already exists ------`,
      );

      if (documentSnapshot.exists) {
        console.log(`-------  user ${newUser.userName} already exists ------`);
        const error = new Error(
          `The ${newUser.userName} name is already taken`,
        );
        error.statusCode = 400;
        return next(error);
      }
      console.log(`-------  user name ${newUser.userName} is free ------`);

      return clientAuth.createUserWithEmailAndPassword(
        newUser.email,
        newUser.password,
      );
    })
    .then(userCredentials => {
      console.log(
        `------ autorizing a user with email ${newUser.email} ------`,
      );
      if (!userCredentials) {
        console.log(`-------  Autorization error ------`);
        const error = new Error(`Autorization error`);
        error.statusCode = 400;
        return next(error);
      }
      userId = userCredentials.user.uid;
      return userCredentials.user.getIdToken();
    })
    .then(userToken => {
      console.log("------ got user token -------");
      token = userToken;
      const newUserCredentials = {
        userId,
        userName: newUser.userName,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: newUser.imageUrl,
      };
      return db.doc(`users/${newUser.userName}`).set(newUserCredentials);
    })
    .then(writeResult => {
      console.log("------ creating new user in database ------");
      if (!writeResult.writeTime) {
        console.log("------- failed to create a user ------");
        const error = new Error("Cannot create a new user");
        error.statusCode = 500;
        return next(error);

        // throw res.status(500).json({ error: "cannot create a new user" });
      }
      console.log(
        `------- new user was created at ${writeResult.writeTime.toDate()} ------`,
      );

      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err.message);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ error: err.message });
      }
      return res.json({ error: err.message, status: error.statusCode });
    });
});

module.exports = router;
