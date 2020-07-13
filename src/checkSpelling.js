module.exports = async function ({ payload }) {
  // 1. Get the PR
  // 2. Get all the diffs
  // 3. Spell check them
  // 4. Collapse multiple typos in on line into one change
  // 5. Suggest the changes

  console.log(payload);
};
