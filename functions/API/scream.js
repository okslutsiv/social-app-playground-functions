const { db } = require("../utils/admin");
const { FBAuth } = require("../utils/fbAuth");
const express = require("express");

const router = express.Router();

//add new
router.post("/", FBAuth, (req, res, next) => {
  const newScream = {
    body: req.body.body.trim(),
    userName: req.userName,
    imageUrl: req.imageUrl,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
  };

  db.collection("screams")
    .add(newScream)
    .then(documentReference => {
      console.log("-----Creating a scream-------");
      if (!documentReference.id) {
        console.log("-----Cannot create new scream------");
        const error = new Error("Cannot create new scream");
        error.statusCode = 500;
        return next(error);
      }
      console.log(`-----Created new scream ${documentReference.id}------`);

      return res.json({
        ...newScream,
        screamId: documentReference.id,
      });
    })
    .catch(err => {
      console.error(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//read one
router.get("/:screamId", (req, res) => {
  let screamData = {
    screamId: "",
    data: {},
    comments: [],
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(documentSnapshot => {
      console.log("-----getting the scream------");
      if (!documentSnapshot.exists) {
        console.log("-----the scream not found------");
        const error = new Error("This scream does not exist");
        error.statusCode = 404;
        return next(error);
      }

      screamData.data = documentSnapshot.data();
      screamData.screamId = documentSnapshot.id;

      return db
        .collection("comments")
        .orderBy("createdAt", "asc")
        .where("screamId", "==", screamData.screamId)
        .get();
    })
    .then(querySnapshot => {
      console.log("-----getting comments------");
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(documentSnapshot => {
          screamData.comments.push({
            commentId: documentSnapshot.id,
            ...documentSnapshot.data(),
          });
        });
      }
      console.log("-----no comments found------");
      return res.json(screamData);
    })
    .catch(err => {
      console.error(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

// delete own scream
router.delete("/:screamId", FBAuth, (req, res) => {
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(documentSnapshot => {
      console.log("-----getting the scream-----");
      if (!documentSnapshot.exists) {
        console.log("----- the scream not found-----");
        const error = new Error("Not found");
        error.statusCode = 404;
        return next(error);
      }
      if (documentSnapshot.data().userName !== req.userName) {
        console.log("----- not own scream -----");
        const error = new Error("Forbidden for this user");
        error.statusCode = 403;
        return next(error);
      }
      return documentSnapshot.ref.delete();
    })
    .then(writeResult => {
      console.log("----- deleting the scream -----");

      if (!writeResult.writeTime) {
        console.log("----- failed to delete the scream -----");
      }

      console.log(
        `-----Document was successfully deleted at ${writeResult.writeTime.toDate()}-----`,
      );
      return res.json({
        message: "Scream deleted successfully",
      });
    })
    .catch(err => {
      console.error(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

// comment on the scream
router.post(`/:screamId/comment`, FBAuth, (req, res) => {
  const newComment = {
    body: req.body.body,
    userName: req.userName,
    imageUrl: req.imageUrl,
    screamId: req.params.screamId,
    createdAt: new Date().toISOString(),
  };
  let commentsCount = 0;

  return db
    .doc(`/screams/${req.params.screamId}`)
    .get()
    .then(documentSnapshot => {
      console.log("----- getting the scream------");
      if (!documentSnapshot.exists) {
        console.log("----- the scream not found ------");
        const error = new Error("Not found");
        error.statusCode = 404;
        return next(error);
      }

      commentsCount = documentSnapshot.data().commentsCount;

      return db.collection("comments").add(newComment);
    })

    .then(documentReference => {
      if (!documentReference.id) {
        console.log(`-----cannot create a comment-----`);
      }
      console.log(`Comment ${documentReference.id} was successfully created`);
      newComment.commentId = documentReference.id;
      commentsCount++;
      return db.doc(`/screams/${req.params.screamId}`).update({
        commentsCount,
      });
    })
    .then(writeResult => {
      console.log(`-----updating the scream-----`);

      if (!writeResult.writeTime) {
        console.log(`-----cannot update the scream-----`);
      }

      console.log(
        `-----Comment was successfully created at ${writeResult.writeTime.toDate()}-----`,
      );
      return res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//delete own comment
router.delete("/:screamId/comment/:commentId", FBAuth, (req, res) => {
  db.doc(`/comments/${req.params.commentId}`)
    .get()
    .then(documentSnapshot => {
      console.log("------getting the comment------");

      if (!documentSnapshot.exists) {
        console.log("------comment not found------");
        const error = new Error("Not found");
        error.statusCode = 404;
        return next(error);
      } else if (documentSnapshot.data().userName !== req.userName) {
        console.log("------not users own comment------");
        const error = new Error();
        error.statusCode = 403;
        return next(error);
      }
      return documentSnapshot.ref.delete();
    })
    .then(writeResult => {
      console.log("------deleting the comment------");

      if (!writeResult.writeTime) {
        console.log(`------Comment was not deleted------ `);
      }
      console.log(
        `------ Comment was successfully deleted at ${writeResult.writeTime.toDate()} ------`,
      );
      return db.doc(`screams/${req.params.screamId}`).get();
    })
    .then(documentSnapshot => {
      console.log(`------looking for the scream------ `);
      if (!documentSnapshot.exists) {
        console.log(`------cannot find the scream------ `);
        const error = new Error("Not found");
        error.statusCode = 404;
        return next(error);
      }
      const commentsCount = documentSnapshot.data().commentsCount - 1;
      return documentSnapshot.ref.update({
        commentsCount,
      });
    })
    .then(writeResult => {
      console.log("------updating the scream------");
      if (!writeResult.writeTime) {
        console.log("------cannot update the scream--------");
      }
      console.log(
        `------Scream was successfully updated at ${writeResult.writeTime.toDate()}------`,
      );
      return res.json({
        message: `Comment was successfully deleted at ${writeResult.writeTime.toDate()}`,
      });
    })
    .catch(err => {
      console.error(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//like the scream
//user can like scream if 1)a scream exists , 2) it have not been liked already
router.get(`/:screamId/like`, FBAuth, (req, res) => {
  let screamData = {};
  const newLike = {
    userName: req.userName,
    screamId: req.params.screamId,
  };
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(documentSnapshot => {
      console.log("------ looking for the scream------");
      if (!documentSnapshot.exists) {
        console.log("------scream not found-------");
        const error = new Error("Not found");
        error.statusCode = 404;
        return next(error);
      }
      screamData = documentSnapshot.data();
      return db
        .collection("likes")
        .where("userName", "==", req.userName)
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then(querySnapshot => {
      console.log("------ checking if the scream was alredy liked ------");

      if (!querySnapshot.empty) {
        console.log("------ scream was alredy liked ------");
        const error = new Error("The scream was alredy liked");
        error.statusCode = 400;
        return next(error);
      }
      console.log("------ scream was not liked yet ------");

      return db.collection("likes").add(newLike);
    })
    .then(documentReference => {
      console.log("------ creating new like ------");
      if (!documentReference.id) {
        console.log(`------ Like was not created------`);
      }

      console.log(`------ Like ${documentReference.id} was created------`);
      screamData.likesCount++;
      return db.doc(`/screams/${req.params.screamId}`).update({
        likesCount: screamData.likesCount,
      });
    })
    .then(writeResult => {
      console.log("------ updating the scream ------");
      if (!writeResult.writeTime) {
        console.log("------ canot update the scream ------");
      }
      console.log("------ the scream was successfuly liked ------");

      return res.json(screamData);
    })
    .catch(err => {
      console.log(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//unlike the scream
//user can unlike scream if 1)scream exists , 2) it have been liked already
router.get(`/:screamId/unlike`, FBAuth, (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(documentSnapshot => {
      console.log("------ looking for the scream ------");
      if (!documentSnapshot.exists) {
        console.log("------ scream not found ------");
        const error = new Error();
        error.statusCode = 404;
        return next(error);
      }
      console.log("------ found the scream ------");

      screamData = documentSnapshot.data();

      return db
        .collection("likes")
        .where("userName", "==", req.userName)
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then(querySnapshot => {
      console.log("------ checking if the scream was already liked ------");
      if (querySnapshot.empty) {
        console.log("------ scream was not liked by you ------");
        const error = new Error("The scream was not liked by the user");
        error.statusCode = 400;
        return next(error);
      }
      console.log("------ scream was liked by you ------");
      return querySnapshot.docs[0].ref.delete();
    })
    .then(writeResult => {
      console.log("------ deleting the like ------");
      if (!writeResult.writeTime) {
        console.log("------ cannot delete the like ------");
      }
      console.log(
        `Document was successfully deleted at ${writeResult.writeTime.toDate()}`,
      );
      console.log(
        `------ like was deleted successfully on ${writeResult.writeTime.toDate()}  ------`,
      );
      screamData.likesCount--;
      return db.doc(`/screams/${req.params.screamId}`).update({
        likesCount: screamData.likesCount,
      });
    })
    .then(writeResult => {
      console.log("------ updating the scream ------");
      if (!writeResult.writeTime) {
        console.log("------ cannot update the scream -------");
      }
      console.log(
        `------ scream was successfully updated on ${writeResult.writeTime.toDate()} ------ `,
      );
      return res.json(screamData);
    })
    .catch(err => {
      console.log(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

module.exports = router;
