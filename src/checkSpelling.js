const {
  publishResponse,
  fetchDiffs,
  transformChanges,
  checkSpelling,
  composeFeedback,
} = require("./helper");

// 1. Get the PR
// 2. Get all the diffs
// 3. Get all the files with changes
// 4. Spell check them
// 5?. Collapse multiple typos in on line into one change. You might want to commit only some of the suggestions.
// 6. Suggest the changes

module.exports = async function (input) {
  if (!input) return; // Nothing to do

  const { owner, repoName, commits, pullRequestId } = input;

  const comments = await fetchDiffs(owner, repoName, commits)
    .then(transformChanges)
    // .then(fetchFiles)
    // Currently we check spelling line by line which is inneficient and doesn't
    // allow accounting for the programming language syntax.
    // We could fetch modified files, check them and then map the lines back to the diff
    .then(checkSpelling)
    .then(composeFeedback)
    .catch((error) => console.error(error));

  const response = await publishResponse(pullRequestId, comments);

  console.log(response); // Here we get the PR review ID to store and update if we decide to use Approve / Request_Changes
  // {
  //   addPullRequestReview: {
  //     pullRequestReview: { id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3NDUwMDI1NjA0' }
  //   }
  // }
};
