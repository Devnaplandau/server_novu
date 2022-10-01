const { Novu } = require("@novu/node");

const sendMailNovu = async (Email) => {
  const novu = new Novu("cc31476446244ecf397a5f5c4d59f4df");
  try {
    await novu.trigger("send-mail", {
      to: {
        subscriberId: "1aae21c9-fe9a-4c13-8017-8da65b809031",
        email: Email,
      },
      payload: {
        email: Email,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { sendMailNovu };
