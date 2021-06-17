# Plugin updater/syncer

A workflow for updating/syncing premium plugins automatically in a repo.

## How it works

The workflow will download and extract the zip file given from your source URL. The changes will get compared to the earlier commit. If changes exist, a new branch will be created. The changes will then get pushed, and a PR is submitted.

If a secondary GitHub token is provided in the input of `approval_github_token`, the PR will get automatically approved, merged, and a Release and tag will be created.

[See diagram](#Diagram) for further details.

## Example GitHub Action workflow

```yml
name: Update plugin on schedule

on:
    schedule:
        # Runs every day at 7am UTC
        - cron: '0 7 * * *'

jobs:
    replicate_changes:
        runs-on: ubuntu-latest

        steps:
            - name: Checkout repository
              uses: actions/checkout@v2
            - name: Update plugin from soruce
              uses: designcontainer/workflow-plugin-updater@master
              with:
                  github_token: ${{ secrets.BOT_TOKEN }}
                  approval_github_token: ${{ secrets.GITHUB_TOKEN }}
                  committer_username: web-flow
                  committer_email: noreply@github.com
                  source: https://example.com/plugin/download?key=${{ secrets.PLUGIN_TOKEN }}
```

## Configuration

| Name                    | Descripion                                                                                                                                                         | Required | Default            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------ |
| `github_token`          | Token to use GitHub API. It must have "repo" and "workflow" scopes so it can push to repo and edit workflows.                                                      | true     | -                  |
| `source`                | Download URL for getting plugin source zip.                                                                                                                        | true     | -                  |
| `approval_github_token` | Secondary token used for auto approving pull requests. Without this token, PR's will not get autoapproved and merged.                                              | false    | -                  |
| `committer_username`    | The username (not display name) of the committer that will be used in the commit of changes in the workflow file in specific repository. In the format `web-flow`. | false    | web-flow           |
| `committer_email`       | The email of the committer that will be used in the commit of changes in the workflow file in specific repository. In the format `noreply@github.com`.             | false    | noreply@github.com |

## Diagram

![plugin-updater diagram](https://user-images.githubusercontent.com/25268506/122348486-81ac9480-cf4b-11eb-941d-1c4a48f32cef.png)
