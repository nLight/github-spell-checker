const Diff = require("diff");
const fetch = require("node-fetch");
const graphqlWithAuth = require("./graphql");
const {
  checkText,
  mergeSettings,
  getDefaultSettings,
  getGlobalSettings,
  getLanguagesForExt,
  constructSettingsForText,
} = require("cspell-lib");

/**
 * Return distinct commits that contain addtions and modifications
 * Push event has some additional info on commits that we use here.
 * Unfortunately commit api doesn't provide `added` and `modified` fields
 * @param {*} commits
 */
module.exports.commitsWithDistinctAdditions = (commits) =>
  commits
    // Some of the commits Github have already seen, we need only distinct commits
    .filter(({ distinct }) => distinct)
    // Take only commits with added or modified files
    .filter(({ added, modified }) => added.length > 0 || modified.length > 0);

/**
 * Get associated PR by the commit sha
 * @param {*} owner - repository owner
 * @param {*} repoName -repository name
 * @param {*} oid - commit sha
 */
module.exports.getPullRequestId = async (owner, repoName, oid) =>
  graphqlWithAuth(
    `
        query($owner: String!, $repoName: String!, $oid: GitObjectID!) {
          repository(owner: $owner, name: $repoName) {
            object(oid: $oid) {
              ... on Commit {
                associatedPullRequests(first: 1) {
                  nodes {
                    id
                    url
                    number
                  }
                }
              }
            }
          }
        }
      `,
    {
      owner,
      repoName,
      oid,
    }
  )
    .then(
      ({ repository }) => repository.object.associatedPullRequests.nodes[0]?.id
    )
    .catch((err) => console.error(err));

/**
 * Publish response as a Github PR review
 * @param {*} pullRequestId
 * @param {*} comments
 */
module.exports.publishResponse = (pullRequestId, comments) =>
  graphqlWithAuth(
    `
    mutation AddPullRequestReviewComments(
      $pullRequestId: ID!
      $body: String
      $comments: [DraftPullRequestReviewComment] = []
      $event: PullRequestReviewEvent = COMMENT
    ) {
      addPullRequestReview(
        input: {
          comments: $comments
          pullRequestId: $pullRequestId
          event: $event
          body: $body
        }
      ) {
        pullRequestReview {
          id, url
        }
      }
    }
  `,
    {
      pullRequestId,
      // APPROVE / REQUEST_CHANGES would create a PR review instance.
      // It's not possible to submit multiple, only edit. So the hook would need to track the ids
      event: "COMMENT", // comments.length === 0 ? "APPROVE" : "REQUEST_CHANGES",
      body:
        comments.length === 0
          ? "Good job! I didn't find any spelling issues"
          : "Please consider my spelling suggestions",
      comments,
    }
  );

/**
 * Fetch diff files from Github
 * @param {*} owner - repo owner
 * @param {*} name - repo name
 * @param {*} commits - array of commit SHAs
 */
module.exports.fetchDiffs = (owner, name, commits) =>
  Promise.all(
    commits.map(({ id }) =>
      fetch(`https://github.com/${owner}/${name}/commit/${id}.diff`, {
        headers: {
          authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      })
        .then((res) => res.text())
        .then((text) => Diff.parsePatch(text))
    )
  ).then((commits) => commits.reduce((acc, commit) => acc.concat(commit), []));

/**
 * Transform changes
 * Takes .md files but only those hunks that contain additions
 * @param {*} diffs
 */
module.exports.transformChanges = (diffs) => {
  const changes = [];

  diffs
    .filter((diff) => diff.newFileName?.match(/\.md$/))
    .forEach(({ newFileName, hunks }) =>
      hunks.forEach(({ lines }) =>
        lines.forEach((line, index) => {
          // Take non empty lines with additions
          if (line.startsWith("+") && line.trim() !== "+") {
            changes.push({
              fileName: newFileName.substr(2), // remove `b/` prefix
              diffPosition: index + 1, // 1 - based index 🙄
              text: line.substr(1), // Remove the `+` from the beginning
            });
          }
        })
      )
    );

  return changes;
};

/**
 * Check spelling line by line. Hardcoded language is markdown and
 * the only extension we check is `md`
 * @param {*} lines
 */
module.exports.checkSpelling = (lines) => {
  const settings = mergeSettings(getDefaultSettings(), getGlobalSettings());
  const languageIds = getLanguagesForExt("md");
  const config = constructSettingsForText(settings, "", languageIds);

  return Promise.all(
    lines.map((line) =>
      checkText(line.text, config).then(({ items }) =>
        items
          .filter((item) => item.isError)
          .map((item) => ({
            ...line,
            typo: item.text,
          }))
      )
    )
  ).then((lines) => lines.reduce((acc, diff) => acc.concat(diff), []));
};

/**
 * Turn internal representation into the graphql mutation format
 * @param {*} lines
 */
module.exports.composeFeedback = (lines) =>
  lines.map((line) => ({
    body: `Potential typo: \`${line.typo}\``,
    position: line.diffPosition,
    path: line.fileName,
  }));

/**
 * Promise chain debug helper function
 * @param {*} cb
 */
module.exports.tap = (cb) => (input) => {
  cb(input);
  return input;
};
