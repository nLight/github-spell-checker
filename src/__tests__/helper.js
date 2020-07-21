jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox());

const fetchMock = require("node-fetch");

const fs = require("fs");
const assert = require("assert");
const Diff = require("diff");

const {
  mergeSettings,
  getDefaultSettings,
  getGlobalSettings,
  getLanguagesForExt,
  constructSettingsForText,
} = require("cspell-lib");

const {
  commitsWithDistinctAdditions,
  transformChanges,
  checkSpelling,
  getConfig,
} = require("../helper");

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

    const settings = mergeSettings(getDefaultSettings(), getGlobalSettings());
    const languageIds = getLanguagesForExt("md");
    const config = constructSettingsForText(settings, "", languageIds);
    const checkSpellingWithConfig = checkSpelling(config);

    const result = await checkSpellingWithConfig(input);

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

describe("getConfig", () => {
  const owner = "mock-owner";
  const repoName = "mock-repo";

  afterEach(() => {
    fetchMock.reset();
  });

  describe("with one of the files present", () => {
    beforeEach(() => {
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/cspell.json`,
        JSON.stringify({ words: ["test"] })
      );
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/cSpell.json`,
        404
      );
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/.cspell.json`,
        404
      );
    });

    it("fetches config files", async () => {
      const result = await getConfig(owner, repoName);

      assert.deepEqual(result.words, ["test"]);
    });
  });

  describe("with all the files missing", () => {
    beforeEach(() => {
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/cspell.json`,
        404
      );
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/cSpell.json`,
        404
      );
      fetchMock.mock(
        `https://raw.githubusercontent.com/${owner}/${repoName}/master/.cspell.json`,
        404
      );
    });

    it("gracefully skips missing default files", async () => {
      const result = await getConfig(owner, repoName);

      assert.deepEqual(result.words, []);
    });
  });
});
