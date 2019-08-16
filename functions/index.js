const functions = require("firebase-functions");
const cors = require("cors");
const app = require("express")();
const { FBAuth } = require("./utils/fbAuth");
const API = require("./API");
const { db, admin } = require("./utils/admin");

app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "🦄🌈✨👋🌎🌍🌏✨🌈🦄😸😼",
  });
});

// https://baseurl/api/v1/screams
app.use("/v1", API);

exports.api = functions.region("europe-west1").https.onRequest(app);

// =======Triggers=======

// *** on scream's like ***

exports.createNotificationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{likeId}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(docSnapshot => {
        if (
          docSnapshot.exists &&
          docSnapshot.data().userName !== snapshot.data().userName
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: docSnapshot.data().userName,
            sender: snapshot.data().userName,
            type: "like",
            read: false,
            screamId: docSnapshot.id,
          });
        } else {
          console.log("Not found or you are trying to like yourself");
          throw new Error("Not found or you are trying to like yourself");
        }
      })
      .catch(err => console.error(err));
  });

// *** on scream's unlike ***

exports.deleteNotificationOnUnlike = functions
  .region("europe-west1")
  .firestore.document(`/likes/{likeId}`)
  .onDelete(snapshot => {
    return db
      .doc(`notifications/${snapshot.id}`)
      .delete()
      .catch(err => console.log(err));
  });

// *** on scream's comment ***

exports.createNotificationOnComment = functions
  .region("europe-west1")
  .firestore.document(`comments/{commentId}`)
  .onCreate(snapshot => {
    return db
      .doc(`screams/${snapshot.data().screamId}`)
      .get()
      .then(docSnapshot => {
        if (
          docSnapshot.exists &&
          docSnapshot.data().userName !== snapshot.data().userName
        ) {
          return db.doc(`notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: docSnapshot.data().userName,
            sender: snapshot.data().userName,
            type: "comment",
            read: false,
            screamId: docSnapshot.id,
          });
        } else {
          throw new Error("Not found or you are commenting yourself");
        }
      });
  });

// *** delete all associated likes & comments on scream delete ***
exports.onScreamDelete = functions
  .region("europe-west1")
  .firestore.document("screams/{screamId}")
  .onDelete((snapshot, context) => {
    const writeBatch = db.batch();
    const screamId = context.params.screamId;
    console.log(screamId);
    return db
      .collection(`comments`)
      .where("screamId", "==", screamId)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(docQuerySnapshot =>
          writeBatch.delete(db.doc(`comments/${docQuerySnapshot.id}`)),
        );
        return db
          .collection("likes")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(querySnapshot => {
        querySnapshot.forEach(docQuerySnapshot =>
          writeBatch.delete(db.doc(`likes/${docQuerySnapshot.id}`)),
        );
        return db
          .collection("notifications")
          .where("screamId", "==", screamId)
          .get();
      })
      .then(querySnapshot => {
        querySnapshot.forEach(docQuerySnapshot =>
          writeBatch.delete(db.doc(`notifications/${docQuerySnapshot.id}`)),
        );
        return writeBatch.commit();
      })
      .then(() => console.log("All stuff gone"))
      .catch(err => console.log(err));
  });

// *** when a user uploads his new avatar update all associated screams and comments, where imageUrl is displayed ***
exports.onImageUpdate = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate(change => {
    const writeBatch = db.batch();
    console.log(change.before.data());
    console.log(change.after.data());

    const newImageUrl = change.after.data().imageUrl;

    if (newImageUrl !== change.before.data().imageUrl) {
      console.log("image has changed");
      return db // get screams
        .collection("screams")
        .where("userName", "==", change.after.data().userName)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(docQuerySnapshot => {
            const scream = db.doc(`/screams/${docQuerySnapshot.id}`);
            const newImageUrl = change.after.data().imageUrl;
            writeBatch.update(scream, {
              imageUrl: newImageUrl,
            });
          });
          return db //get comments
            .collection("comments")
            .where("userName", "==", change.after.data().userName)
            .get();
        })
        .then(querySnapshot => {
          querySnapshot.forEach(docQuerySnapshot => {
            const comment = db.doc(`/comments/${docQuerySnapshot.id}`);
            const newImageUrl = change.after.data().imageUrl;
            writeBatch.update(comment, {
              imageUrl: newImageUrl,
            });
          });
          return writeBatch.commit();
        });
    } else console.log("Nothing to update");
    return true;
  });
