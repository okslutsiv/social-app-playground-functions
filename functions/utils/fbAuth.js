const { db, serverAuth } = require("./admin");

exports.FBAuth = (req, res, next) => {
  //get the idToken from the headers
  let idToken = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    return res.status(403).json({ error: "Not authorized" });
  }

  return serverAuth
    .verifyIdToken(idToken)
    .then(veryfiedToken => {
      const reqUserId = veryfiedToken.uid;
      return db
        .collection("users")
        .where("userId", "==", reqUserId)
        .limit(1)
        .get();
    })
    .then(data => {
      const user = data.docs[0].data();
      req.userName = user.userName;
      req.imageUrl = user.imageUrl;
      return next();
    })
    .catch(err => {
      console.error("Error while verifying token", err.message);
      return res.status(403).json({ error: err.message, code: err.code });
    });
};
