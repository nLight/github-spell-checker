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

## Credits

Inspired by https://github.com/check-spelling/check-spelling but it has no tests, no comments and written in Perl. 
Also Github Actions are not available for some accounts.
