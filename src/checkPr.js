const debug = require("debug")("checkSpelling");

const { commitsWithDistinctAdditions, getPullRequestId } = require("./helper");

module.exports = async function ({ payload }) {
  const owner = payload.repository.owner.name;
  const repoName = payload.repository.name;
  const oid = payload.commits[0]?.id;

  // Some of the events come with no commits
  const commits = commitsWithDistinctAdditions(payload.commits);

  if (commits.length === 0) {
    debug("No commits, nothing to do here");
    return Promise.resolve();
  }

  const pullRequestId = await getPullRequestId(owner, repoName, oid);
  debug(`PR ID: ${pullRequestId}`);

  // Some of the push events aren't associated with any PR
  if (pullRequestId == null) {
    debug(`Seems like the push is not connected to a PR. Nothing to do!`);
    return Promise.resolve();
  }

  return Promise.resolve({
    owner,
    repoName,
    pullRequestId,
    commits: payload.commits,
  });
};
