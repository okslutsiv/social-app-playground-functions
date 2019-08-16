const { db, admin } = require("../utils/admin");
const { FBAuth } = require("../utils/fbAuth");
const { firebaseConfig } = require("../utils/config");
const express = require("express");
const BusBoy = require("busboy");
const os = require("os");
const path = require("path");
const fs = require("fs");

const router = express.Router();

//user can upload custom avatar.
//This code emits BadRequest error :"Unexpected end of multipart data" on localhost sometimes, but runs well on firestore
router.post("/image", FBAuth, (req, res, next) => {
  let imageToBeUploaded = {
    extension: "",
    fileName: "",
    mimetype: "",
    filePath: "",
  };
  let fstream = null;

  const busboy = new BusBoy({
    headers: req.headers,
  });
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(
      "File [" +
        fieldname +
        "]: filename: " +
        filename +
        ", encoding: " +
        encoding +
        ", mimetype: " +
        mimetype,
    );
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      throw res.status(400).json({
        error: "Wrong file type submitted",
      });
    }

    imageToBeUploaded.extension = filename.split(".")[
      filename.split(".").length - 1
    ];
    // never trust user's filenames, give it your own
    // imageToBeUploaded.fileName = `${req.userName}${Date.now().toString()}.${
    // give the image a non-unique name to enable simple update in case the user reuploads the profile image
    imageToBeUploaded.fileName = `${req.userName}${Date.now().toString()}.${
      imageToBeUploaded.extension
    }`;
    imageToBeUploaded.mimetype = mimetype;
    imageToBeUploaded.filePath = path.join(
      os.tmpdir(),
      imageToBeUploaded.fileName,
    );

    fstream = fs.createWriteStream(imageToBeUploaded.filePath);

    file.on("data", data => {
      console.log("File [" + fieldname + "] got " + data.length + " bytes");
    });

    file.on("end", () => {
      console.log("File [" + fieldname + "] Finished");
    });
    file.on("error", error => {
      console.error("File parsing error", error);
    });

    return file.pipe(fstream);
    // return busboy.pipe(fstream);
  });

  busboy.on("error", error => {
    console.error("Busboy on file error", error);
  });

  busboy.on("finish", () => {
    const bucket = admin.storage().bucket(firebaseConfig.storageBucket);
    const pref = `${req.userName}-profile-img`;

    bucket
      .getFiles({ directory: `${req.userName}-profile-img` })
      .then(data => {
        if (data[0].length > 0) {
          console.log(
            `-------starting deleting images in ${
              req.userName
            }-profile-img directory--------`,
          );

          return bucket.deleteFiles({
            directory: `${req.userName}-profile-img`,
            force: true,
          });
        } else return true;
      })
      .then(() => {
        console.log(
          `-------starting uploading ${pref}/${
            imageToBeUploaded.fileName
          }--------`,
        );

        return bucket.upload(`${imageToBeUploaded.filePath}`, {
          destination: `${pref}/${imageToBeUploaded.fileName}`,
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype,
              changed: Date.now().toString(),
            },
          },
        });
      })
      // .getFiles({ directory: `${req.userName}-profile-img` })
      // .then(data => {
      //   console.log(data[0]);
      //   const fileToDelete = data[0][0];
      //   console.log(fileToDelete);
      //   return bucket.file(fileToDelete).delete();
      // })

      // .then(data => {
      //   if (!data[0]) {
      //     console.log("------Cannot delete previous image------");
      //     const error = new Error("Cannot delete previous image ");
      //     error.statusCode = 500;
      //     return next(error);
      //   }
      //   console.log(`-------${imageToBeUploaded.fileName} was deleted--------`);

      //   return bucket.upload(imageToBeUploaded.filePath, {
      //     resumable: false,
      //     metadata: {
      //       metadata: {
      //         contentType: imageToBeUploaded.mimetype,
      //         changed: Date.now().toString(),
      //         baseName: `${req.userName}-profile-img`,
      //       },
      //     },
      //   });
      // })
      .then(data => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
          firebaseConfig.storageBucket
        }/o/${pref}%2F${imageToBeUploaded.fileName}?alt=media`;

        return db.doc(`/users/${req.userName}`).update({
          imageUrl,
        });
      })
      .then(writeResult => {
        if (!writeResult.writeTime) {
          const error = new Error("Cannot upload image");
          error.statusCode = 500;
          return next(error);
        }
        console.log(
          `-----Image was updated successfully on ${writeResult.writeTime.toDate()}-----`,
        );
        return res.json({
          message: `Image was updated successfully on ${writeResult.writeTime.toDate()}`,
        });
      })
      .catch(err => {
        console.error(err);
        res.status[err.statusCode || 500].json({ error: err.message });
      });
  });
  busboy.end(req.rawBody);
});

//====================
//update own details

router.post("/edit", FBAuth, (req, res, next) => {
  let details = {};
  details.bio = req.body.bio || "";
  details.location = req.body.location || "";
  details.website = req.body.website || "";
  db.doc(`/users/${req.userName}`)
    .get()
    .then(documentSnapshot => {
      console.log("-------looking for the user ---------");
      if (!documentSnapshot.exists) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
      }
      return documentSnapshot.ref.update({
        ...details,
      });
    })
    .then(writeResult => {
      console.log("-------trying to update ---------");

      if (!writeResult.writeTime) {
        const error = new Error("Failed to update");
        error.statusCode = 404;
        return next(error);
      }
      console.log(
        `-------User's detailes were updated on ${writeResult.writeTime.toDate()}---------`,
      );
      return res.json(details);
    })
    .catch(err => {
      console.error(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//=============================
//get own user details
router.get("/me", FBAuth, (req, res, next) => {
  let userData = {
    profile: {},
    notifications: [],
    likes: [],
  };
  db.doc(`/users/${req.userName}`)
    .get()
    .then(documentSnapshot => {
      console.log("-----Getting profile-------");
      if (!documentSnapshot.exists) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
      }
      userData.profile = documentSnapshot.data();
      return db
        .collection("notifications")
        .where("recipient", "==", req.userName)
        .where("read", "==", false)
        .orderBy("createdAt", "desc")
        .get();
    })
    .then(querySnapshot => {
      console.log("-----Getting notifications-------");
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(documentQuerySnapshot => {
          userData.notifications.push({
            ...documentQuerySnapshot.data(),
            notificationId: documentQuerySnapshot.id,
          });
        });
      } else console.log("------No notifications----------");

      return db
        .collection("likes")
        .where("userName", "==", req.userName)
        .get();
    })
    .then(querySnapshot => {
      console.log("-----Getting likes-------");
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(documentQuerySnapshot => {
          userData.likes.push({
            ...documentQuerySnapshot.data(),
          });
        });
      } else console.log("------No likes--------");

      return res.json(userData);
    })
    .catch(err => {
      console.log(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//==================================
//get userPage details

router.get("/:userName", (req, res, next) => {
  let userData = {
    profile: {},
    screams: [],
  };
  db.doc(`/users/${req.params.userName}`)
    .get()
    .then(documentSnapshot => {
      console.log("-------quering user-------------");

      if (!documentSnapshot.exists) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
      }
      userData.profile = documentSnapshot.data();
      return db
        .collection("screams")
        .where("userName", "==", req.params.userName)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
    })
    .then(querySnapshot => {
      console.log("-------quering screams-------------");
      if (querySnapshot.size === 0) {
        console.log("-------no screams found-------------");
      } else {
        querySnapshot.forEach(documentQuerySnapshot => {
          userData.screams.push({
            ...documentQuerySnapshot.data(),
            screamId: documentQuerySnapshot.id,
          });
        });
      }

      return res.json(userData);
    })
    .catch(err => {
      console.log(err);
      res.status[err.statusCode || 500].json({ error: err.message });
    });
});

//mark user's notifications read
router.post(
  "/:userName/notification/:notificationId",
  FBAuth,
  (req, res, next) => {
    db.doc(`notifications/${req.params.notificationId}`)
      .get()
      .then(documentSnapshot => {
        console.log("-----getting notification------");
        if (!documentSnapshot.exists) {
          const error = new Error("Notification not found");
          error.statusCode = 404;
          return next(error);
        }
        console.log("-----found " + documentSnapshot.id + "------");
        return documentSnapshot.ref.update({ read: true });
      })
      .then(writeResult => {
        console.log("-----updating ------");
        if (!writeResult.writeTime) {
          console.log("-----failed to update------");
          const error = new Error("Failed to update");
          error.statusCode = 500;
          return next(error);
        }
        console.log(
          `------Notification was read at: ${writeResult.writeTime.toDate()}------`,
        );
        return res.json({
          message: `Notification was read at: ${writeResult.writeTime.toDate()}`,
        });
      })
      .catch(err => {
        console.log(err);
        res.status[err.statusCode || 500].json({ error: err.message });
      });
  },
);

module.exports = router;
