const firebase = require("firebase");
const { firebaseConfig } = require("./config");

firebase.initializeApp(firebaseConfig);

const clientAuth = firebase.auth();
module.exports = { firebase, clientAuth };
