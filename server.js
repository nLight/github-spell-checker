const http = require("http");
const createHandler = require("github-webhook-handler");
const handler = createHandler({
  path: "/spellchecker-webhook",
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

handler.on("push", function (event) {
  console.log(
    "Received a push event for %s to %s",
    event.payload.repository.name,
    event.payload.ref
  );
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
