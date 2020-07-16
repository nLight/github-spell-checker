const fs = require("fs");
const assert = require("assert");
const Diff = require("diff");
const {
  commitsWithDistinctAdditions,
  transformChanges,
  checkSpelling,
} = require("../src/helper");

describe("commitsWithDistinctAdditions", () => {
  describe("with commits with distinct additions", () => {
    it("returns an empty array", () => {
      const commits = [
        {
          id: "eb83e416551dc79520cfd4115011b4fb5c389cf9",
          distinct: true,
          added: ["src/oneFile.js"],
          removed: [],
          modified: [],
        },
        {
          id: "eb83e416551dc79520cfd4115011b4fb5c389cf8",
          distinct: true,
          added: [],
          removed: [],
          modified: ["src/otherFile.js"],
        },
      ];

      const result = commitsWithDistinctAdditions(commits);
      assert.deepEqual(result, commits);
    });
  });

  describe("with no commits", () => {
    it("returns an empty array", () => {
      const commits = [];

      const result = commitsWithDistinctAdditions(commits);
      assert.equal(result.length, 0);
    });
  });

  describe("with no distinct commits", () => {
    it("returns an empty array", () => {
      const commits = [
        {
          id: "eb83e416551dc79520cfd4115011b4fb5c389cf9",
          distinct: false,
          added: [],
          removed: [],
          modified: ["src/checkSpelling.js"],
        },
      ];

      const result = commitsWithDistinctAdditions(commits);
      assert.equal(result.length, 0);
    });
  });

  describe("with no added / modified files", () => {
    it("returns an empty array", () => {
      const commits = [
        {
          id: "eb83e416551dc79520cfd4115011b4fb5c389cf9",
          distinct: true,
          added: [],
          removed: ["src/checkSpelling.js"],
          modified: [],
        },
      ];

      const result = commitsWithDistinctAdditions(commits);
      assert.equal(result.length, 0);
    });
  });
});

describe("transformChanges", () => {
  it("takes only Markdown files", () => {
    const testPatch = fs.readFileSync(
      `${__dirname}/stubs/diff-js+md.patch`,
      "utf8"
    );
    const input = Diff.parsePatch(testPatch);
    const diffs = transformChanges(input);

    assert.deepEqual(
      [{ fileName: "test.md", diffPosition: 3, text: "With a tpyo" }],
      diffs
    );
  });

  it("takes only hunks with modifications", () => {
    const testPatch = fs.readFileSync(
      `${__dirname}/stubs/diff-modifications.patch`,
      "utf8"
    );
    const input = Diff.parsePatch(testPatch);
    const diffs = transformChanges(input);
    assert.deepEqual(
      [
        { fileName: "new.md", diffPosition: 1, text: "# New document" },
        { fileName: "new.md", diffPosition: 3, text: "with a tpoy" },
      ],
      diffs
    );
  });
});

describe("checkSpelling", () => {
  it("checks spelling", async () => {
    const input = [
      { fileName: "new.md", diffPosition: 1, text: "# New document" },
      { fileName: "new.md", diffPosition: 3, text: "with a tpoy" },
    ];
    const result = await checkSpelling(input);
    console.log(result);
    assert.deepEqual(
      [
        {
          diffPosition: 3,
          fileName: "new.md",
          text: "with a tpoy",
          typo: "tpoy",
        },
      ],
      result
    );
  });
});
