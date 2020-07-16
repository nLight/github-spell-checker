const debug = require("debug")("checkSpelling");
const graphqlWithAuth = require("./graphql");

module.exports = async function ({ payload }) {
  const owner = payload.repository.owner.login;
  const repoName = payload.repository.name;
  const prNumber = payload.pull_request.number;
  const pullRequestId = payload.pull_request.node_id;

  const commits = await graphqlWithAuth(
    `
    query($owner: String!, $repoName: String!, $prNumber: Int!) {
      repository(name: $repoName, owner: $owner) {
        pullRequest(number: $prNumber) {
          commits(first: 100) {
            nodes {
              commit {
                oid
              }
            }
          }
        }
      }
    }
  `,
    { owner, repoName, prNumber }
  ).then(({ repository }) =>
    repository.pullRequest.commits.nodes.map(({ commit }) => ({
      id: commit.oid,
    }))
  );

  if (commits.length === 0) {
    debug("No commits, nothing to do here");
    return Promise.resolve();
  }

  return Promise.resolve({ owner, repoName, commits, pullRequestId });
};
