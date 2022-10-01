const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").Server(app);
const PORT = 4000;
const { Novu, PushProviderIdEnum } = require("@novu/node");
const novu = new Novu("cc31476446244ecf397a5f5c4d59f4df");
const { sendMailNovu } = require("./sendMail/novuMail");
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:4979",
  },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

//  caculator like
const increaseLikes = (postId, array) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i].id === postId) {
      array[i].likes += 1;
    }
  }
};
let posts = [];
socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user connected !`);

  socket.on("newPost", (data) => {
    posts.unshift(data);
    //  send data -> client react
    socket.emit("posts", posts);
    console.log(posts);
  });
  socket.on("postLiked", (postId) => {
    //Function accepts the post ID and post array
    increaseLikes(postId, posts);
    //Sends the newly updated array to the React app
    socket.emit("posts", posts);
  });

  socket.on("disconnect", () => {
    console.log("🔥: user disconnect !");
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "Hello world",
  });
});

//  api notify center bell
app.post("/notify", async (req, res) => {
  const { username } = req.body;
  await novu
    .trigger("notificationcenter", {
      to: {
        subscriberId: "4JBaDK_nvnAS",
      },
      payload: {
        username: username,
      },
    })
    .catch((err) => console.error(err));
});
//  api send mail
app.post("/sendmail", async (req, res) => {
  const { Email } = req.body;
  console.log(Email);
  if (!Email) {
    res.json("Form incomplete").status(400);
  }

  try {
    sendMailNovu(Email);
    res.json().status(201);
  } catch (error) {
    res.json(error).status(500);
  }
});
//  api send sms when you click send sms on client
app.post("/sms", async (req, res) => {
  const { account, phone } = req.body;
  await novu
    .trigger("sms-novu", {
      to: {
        subscriberId: "4JBaDK_nvnAS",
        phone: phone,
      },
      payload: {
        account: account,
      },
    })
    .catch((err) => console.error(err));
});
//  api send push
app.post("/push", async (req, res) => {
  const { tokenUser } = req.body;

  const subscriberId = "4JBaDK_nvnAS";
  await novu.subscribers.identify(subscriberId, {
    firstName: "Nguyen",
    lastName: "An",
  });

  await novu.subscribers.setCredentials(subscriberId, PushProviderIdEnum.FCM, {
    deviceTokens: [`${tokenUser}`],
  });
  const trigger = await novu.trigger("fcm-novu", {
    to: {
      subscriberId,
    },
  });
  res.json(trigger.data);
});

// ============================ DEMO Novu Mixed
app.post("/mixed", async (req, res) => {
  const { email, tokenUser, content, phone, firstName, lastName } = req.body;

  const subscriberId = "4JBaDK_nvnAS";
  await novu.subscribers.identify(subscriberId, {
    firstName: firstName,
    lastName: lastName,
  });

  await novu.subscribers.setCredentials(subscriberId, PushProviderIdEnum.FCM, {
    deviceTokens: [`${tokenUser}`],
  });

  novu.trigger("notifi-push-inapp", {
    to: {
      subscriberId: "4JBaDK_nvnAS",
      email: email,
      phone: phone,
    },
    payload: {
      content: content,
    },
  });

  // res.json(trigger.data);
});
// ===========================

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
