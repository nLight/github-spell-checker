# Github PRs spell checker ![CI](https://github.com/nLight/github-spell-checker/workflows/Node.js%20CI/badge.svg?branch=master)

## Config

1. Setup a `push/pull_request` webhook handler OR add [the Github Action](https://github.com/nLight/github-spell-checker/blob/master/.github/workflows/spell-checker.yml)
2. Optionally add a [cspell config file](https://github.com/streetsidesoftware/cspell/tree/master/packages/cspell#customization) to your repo. It won't resolve dictionary definitions for now. You can add `words` and `ignoredWords` though.
3. That's it for now

## How it works

1. Loads the config files
2. Fetches PR changes (pattch files)
3. Filters added/modifyed lines
4. Checks the spelling
5. Suggests the changes as the PR comments
6. **DOES NOT** Remove own stale comments for now

## Roadmap

1. Allow for external config files
2. Support local dictionary definitions
3. Support external dictionary definitions
4. Remove stale comments
5. Support Approve / Request Changes workflow

## Credits

Inspired by https://github.com/check-spelling/check-spelling.

Unfortunately the project has no tests, no comments and written in a mixture of languages. Also Github Actions are not available for some accounts.
