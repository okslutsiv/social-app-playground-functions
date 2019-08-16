const { db } = require("../utils/admin");
const express = require("express");
const router = express.Router();

//get all screams
router.get("/", (req, res) => {
  let screams = [];

  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(querySnapshot => {
      console.log(`------getting screams ------`);
      if (querySnapshot.size > 0) {
        console.log(`------ Got ${querySnapshot.size} screams ------`);
        querySnapshot.forEach(queryDocumentSnapshot => {
          const doc = queryDocumentSnapshot.data();
          screams.push({
            screamId: queryDocumentSnapshot.id,
            body: doc.body,
            userName: doc.userName,
            createdAt: doc.createdAt,
            commentsCount: doc.commentsCount,
            likesCount: doc.likesCount,
            imageUrl: doc.imageUrl,
          });
        });
      } else {
        console.log(`------ No screams found ------`);
      }
      return res.json(screams);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err });
    });
});

module.exports = router;
