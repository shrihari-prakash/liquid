const mongoose = require("mongoose");

function getParam(param) {
    const args = process.argv;
    return args.find(a => a.startsWith(param)).split("=")[1];
}

function createApplicationClient() {
    try {
        mongoose.connect(getParam("mongodbConenctionString"), (_, db) => {
            var client = {
                id: "application_client",
                grants: [
                    "client_credentials",
                    "authorization_code",
                    "refresh_token"
                ],
                redirectUris: getParam("redirectUrls").split(","),
                secret: getParam("clientSecret"),
                role: "INTERNAL_CLIENT",
                displayName: "Application Client"
            };
            db.collection("clients").insertOne(client, function (err) {
                if (err) throw err;
                console.log("Status: OK. Client info:");
                console.log(JSON.stringify(client));
                db.close();
            });
        });
    } catch (error) {
        console.error(error);
    }
}

createApplicationClient();
