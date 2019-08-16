let db = {
  users: [
    {
      bio: "Hello, 😄 my name is user, nice to meet you",
      createdAt: "2019-03-15T10:59:52.798Z",
      email: "user@email.com",
      imageUrl: "image/dsfsdkfghskdfgs/dgfdhfgdh",
      location: "Lonodn, UK",
      userId: "dh23ggj5h32g543j5gf43",
      userName: "user", //unique key
      website: "https://user.com",
    },
  ],
  screams: [
    {
      body: "This is a sample scream",
      commentsCount: 3,
      createdAt: "2019-03-15T10:59:52.798Z",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/social-app-cc043.appspot.com/o/kkk1565096271491.png?alt=media",
      likesCount: 5,
      userName: "user",
    },
  ],
  comments: [
    {
      body: "nice one mate!",
      createdAt: "2019-03-15T10:59:52.798Z",
      imageUrl:
        "https://firebasestorage.googleapis.com/v0/b/social-app-cc043.appspot.com/o/kkk1565096271491.png?alt=media",
      screamId: "kdjsfgdksuufhgkdsufky",
      userName: "user",
    },
  ],
  likes: [{ screamId: "", userName: "lll" }],
  notifications: [
    {
      createdAt: "2019-03-15T10:59:52.798Z",
      read: "true | false",
      recipient: "nnn", //?
      sender: "john",
      screamId: "kdjsfgdksuufhgkdsufky",
      type: "like | comment",
    },
  ],
};
//user methods
const getUserDetails = {
  endpoint: "/user/me",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: {},
  },
  res: {
    userData: {
      profile: {
        bio,
        createdAt,
        email,
        imageUrl,
        location,
        userId,
        userName,
        website,
      },
      notifications: [],
    },
  },
};
const getAanyUserDetails = {
  endpoint: "/user/:userName",
  req: {
    type: "get",
    body: {},
  },
  res: {
    userData: {
      profile: {
        bio,
        createdAt,
        email,
        imageUrl,
        location,
        userId,
        userName,
        website,
      },
      screams: [],
    },
  },
};

const editUsersImage = {
  endpoint: "/user/image",
  Authorization: "Bearer token",
  req: {
    type: "post",
    body: { formData },
  },
  res: {},
  //triggers imageUrl change in screams and comments
};

const editDetails = {
  endpoint: "/user/edit",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: {
      details: {
        bio: "",
        location: "",
        website: "",
      },
    },
  },
  res: {
    details: {},
  },
};

const markNotificationRead = {
  endpoint: "/:userName/notification/:notificationId",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: {},
  },
  res: {},
};

//data endpoints
const getAllScreams = {
  endpoint: "/",
  req: {
    type: "get",
    //Authorization: "Bearer token",
    body: {},
  },
  res: {
    screams: [
      {
        screamId,
        body,
        userName,
        createdAt,
        commentsCount,
        likesCount,
        imageUrl,
      },
    ],
  },
};

const getOneScream = {
  endpoint: "/:screamId",
  req: {
    type: "get",
    //Authorization: "Bearer token",
    body: {},
  },
  res: {
    screamData: {
      screamId: "",
      data: {},
      comments: [],
    },
  },
};
const addScream = {
  endpoint: "/",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: { body: "" },
  },
  res: {
    newScream: {
      body: "",
      userName: "",
      imageUrl: "",
      createdAt: "",
      likesCount: "",
      commentsCount: "",
    },
  },
};

const deleteOwnScream = {
  endpoint: "/:screamId",
  req: {
    type: "delete",
    Authorization: "Bearer token",
    body: {},
  },
  res: {},
};
const editOwnScream = {
  endpoint: "/:screamId",
  req: {
    type: "put",
    Authorization: "Bearer token",
    body: { body: "" },
  },
  res: {},
};
const commentScream = {
  endpoint: "/:screamId/comment",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: { body: "" },
  },
  res: {
    newComment: {
      body,
      userName,
      imageUrl,
      screamId,
      createdAt: new Date().toISOString(),
    },
  },
};
const deleteOwnComment = {
  endpoint: "/:screamId/comment/:commentId",
  req: {
    type: "delete",
    Authorization: "Bearer token",
    body: { body: "" },
  },
  res: {},
  //updates the commentCounts field in the Scream
};
const likeScream = {
  endpoint: "/:screamId/like",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: {},
  },
  res: {
    screamData: {},
  },
};
const unlikeScream = {
  endpoint: "/:screamId/unlike",
  req: {
    type: "post",
    Authorization: "Bearer token",
    body: {},
  },
  res: {
    screamData: {},
  },
};
