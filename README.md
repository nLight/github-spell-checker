# Github PRs spell checker ![Node.js CI](https://github.com/nLight/github-spell-checker/workflows/Node.js%20CI/badge.svg?branch=master)

## Config

1. Dictionary repo
2. Files to observe. Default to markdown

## Workflow

1. Expose the webhook handler
2. Fetch PR changes
3. Filter the files to check
4. Check the spelling
5. Suggest the changes as the PR comments

## commands

1. `/add` to add the suggested word to the dictionary
