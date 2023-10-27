const mongoose = require("mongoose");

function getParam(param) {
  const args = process.argv;
  return args.find((a) => a.startsWith(param)).split("=")[1];
}

async function createApplicationClient() {
  try {
    await mongoose.connect(getParam("mongodbConenctionString"));
    const { db } = mongoose.connection;
    var client = {
      id: "application_client",
      grants: ["client_credentials", "authorization_code", "refresh_token"],
      redirectUris: getParam("redirectUrls").split(","),
      secret: getParam("clientSecret"),
      role: "internal_client",
      scope: ["*"],
      displayName: "Application Client",
    };
    await db.collection("clients").insertOne(client);
    console.log("Status: OK. Client info:");
    console.log(JSON.stringify(client));
    mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

createApplicationClient();
