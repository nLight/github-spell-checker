if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const github = require("@actions/github");
const core = require("@actions/core");

const checkSpelling = require("./src/checkSpelling");
const checkPr = require("./src/checkPr");
const fetchCommits = require("./src/fetchCommits");

async function run() {
  switch (github.context.eventName) {
    case "push":
      await checkPr(github.context).then(checkSpelling);
      break;
    case "pull_request":
      await fetchCommits(github.context).then(checkSpelling);
      break;
  }
}

run();
