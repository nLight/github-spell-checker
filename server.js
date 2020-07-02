const http = require("http");
const { graphql } = require("@octokit/graphql");
const createHandler = require("github-webhook-handler");

require("dotenv").config();

const handler = createHandler({
  path: process.env.WEBHOOK_PATH || "/spellchecker-webhook",
  secret: process.env.GITHUB_SECRET,
});

http
  .createServer(function (req, res) {
    handler(req, res, function (err) {
      res.statusCode = 404;
      res.end("no such location");
    });
  })
  .listen(process.env.PORT);

handler.on("error", function (err) {
  console.error("Error:", err.message);
});

handler.on("ping", function (event) {
  console.log("ping", event.zen);
});

handler.on("push", async function (event) {
  const pr = event.payload.commits[0].sha;
  const { commit } = await graphql(`{

  }`);
});

handler.on("issues", function (event) {
  console.log(
    "Received an issue event for %s action=%s: #%d %s",
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title
  );
});
