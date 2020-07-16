const fs = require("fs");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const checkSpelling = require("./src/checkSpelling");
const checkPr = require("./src/checkPr");
const fetchCommits = require("./src/fetchCommits");

const payload = JSON.parse(
  fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf-8")
);

switch (process.env.GITHUB_EVENT_NAME) {
  case "push":
    checkPr(payload).then(checkSpelling);
    break;
  case "pull_request":
    fetchCommits(payload).then(checkSpelling);
    break;
}
