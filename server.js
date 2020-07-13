const http = require("http");
const checkSpelling = require("./src/checkSpelling");
const { Webhooks } = require("@octokit/webhooks");

// DEV Setup
// GOTO https://smee.io and start a new channel
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
  const EventSource = require("eventsource");

  const source = new EventSource(process.env.WEBHOOK_PROXY_URL);
  source.onmessage = (event) => {
    const webhookEvent = JSON.parse(event.data);
    webhooks
      .verifyAndReceive({
        id: webhookEvent["x-request-id"],
        name: webhookEvent["x-github-event"],
        signature: webhookEvent["x-hub-signature"],
        payload: webhookEvent.body,
      })
      .catch(console.error);
  };
}

const webhooks = new Webhooks({
  path: process.env.WEBHOOK_PATH || "/webhook",
  secret: process.env.GITHUB_SECRET,
});

webhooks.on("ping", function ({ payload }) {
  console.log("Received a ping even", payload);
});
webhooks.on("error", (error) => {
  console.log(`Error occured in "${error.event.name} handler: ${error.stack}"`);
});

webhooks.on("push", checkSpelling);

http.createServer(webhooks.middleware).listen(process.env.PORT);
