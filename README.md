<p align="center">
  <a href="https://github.com/shorelinesoftware/versioning-toolkit"><img alt="typescript-action status" src="https://github.com/shorelinesoftware/versioning-toolkit/workflows/on-master/badge.svg"></a>
</p>

# Versioning-toolkit GitHub action

This action provides a set of helpers for semantic versioning:

1) Auto increment patch version
2) Make prerelease tag
3) Make release
4) Add Tag to Jira issues

# Auto increment patch version

Finds the latest tag by branch name and increments is patch segment. If there are no previous tags that match the branch, the default tag will be created: {branch}-0.0.1.

## Inputs 

### `prefix`

**Required**. The filter to find tag with the highest version by provided prefix.  
For example:
If there are these tags: master-0.0.1, master-0.0.2, release-1.0.0, release-1.0.1, release-1.0.2 and provided prefix is `release-1.0` then the new tag will be release-1.0.2.  
If there are no tags that match the prefix the tag will be `{prefix}-0.0.1`.

### `actionName`

**Required**. The name of the method. Must be **autoIncrementPatch**.

### `push`

**Optional**. Whether to push new tag or not. Must be **'true' or 'false'**. 'false' by default.

## Usage:

```yaml
uses: shorelinesoftware/versioning-toolkit@v0.0.1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  prefix: 'master'
  actionName: 'autoIncrementPatch'
  push: 'true'
  
```

## Outputs

`NEW_TAG`

The newly created tag.

# Make prerelease tag

Makes prerelease tag with the provided prefix. Uses short commit sha as prerelease segment.

## Inputs


### `actionName`

**Required**. The name of the method. Must be **makePrerelease**.

### `prefix`

**Required**. The prefix that will be used for tag. Can be branch name, PR#, tag or any other string value. First it tries to find tag by prefix with the highest version and use the version. Otherwise, default version is used: 0.0.1. e.g. if the prefix is `release` and there are tags: release-0.0.1, release-0.0.2 then the tag will be `release-0.0.2-{commit_sha}` if prefix is `foo` the tag will be `foo-0.0.1-{commit_sha}`.

### `push`

**Optional**. Whether to push new tag or not. Must be **'true' or 'false'**. 'false' by default.

## Outputs

`NEW_TAG`

The newly created tag.

## Usage:

```yaml
uses: shorelinesoftware/versioning-toolkit@v0.0.1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  prefix: ${{ github.head_ref }}
  actionName: 'makePrerelease'
```

# Make release

Creates release branch, updates main tag and pushes new release tag.
## Inputs


### `actionName`

**Required**. The name of the method. Must be **makeRelease**.

### `releasePrefix`

**Required**. The prefix that will be used for release tag and release branch.

### `mainTag`

**Required**. The tag from which release branch should be created.

### `push`

**Optional**. Whether to push changes to repository or not. Must be **'true' or 'false'**. 'false' by default.

### `majorSegment`

**Optional**. New major segment for the main and release tags and release branch.  
Zeroes minor segment if provided without minor segment and its value is higher than actual major segment.

### `minorSegment`

**Optional**. New minor segment for the main and release tags and release branch. 

## Outputs

`NEW_RELEASE_TAG`  
`NEW_MAIN_TAG`  
`NEW_RELEASE_BRANCH`


## Usage:

```yaml
uses: shorelinesoftware/versioning-toolkit@v0.0.1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
    mainTag: main-3.1.17
    releasePrefix: release
    majorSegment: 4
    minorSegment: 1
    actionName: makeRelease
    push: true
```

# Add tag to Jira issues

It gets commits diff between provided tag and the previous tag, parses commits identifying Jira keys and adds tag and fix version created from tag (e.g if tag is master-2.2.0 then fix version will be master-2.2) to each Jira key using provided Jira Tag field name.
## Inputs


### `actionName`

**Required**. The name of the method. Must be **addTagToJiraIssues**.

### `jiraTagFieldName`

**Required**. Field name in Jira to where tag is added.

### `tag`

**Required**. The tag that will be added to each Jira issue.

### `jiraUserEmail`

**Required**. Jira user email used to access Jira.

### `jiraApiToken`

**Required**. Jira Api token used to access Jira.

### `jiraOrgOrigin`

**Required**. Jira organization origin.  

### `preix`

**Optional**. Prefix that will be added to the tag and tag without patch segment. E.g if prefix is `foo-` it will be `foo-main-3.0.1, foo-main-3.0`, without prefix: `main-3.0.1, main-3.0`

### `jiraAdditionalTag`

**Optional**. Additional tag that will be added to each Jira issue in changelog


## Outputs

This action has no output.


## Usage:

```yaml
uses: shorelinesoftware/versioning-toolkit@v0.0.1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  tag: main-3.1.103
  jiraTagFieldName: "Release tag"
  jiraOrgOrigin: "https://foo.atlassian.net"
  jiraUserEmail: ${{ secrets.JIRA_USER_EMAIL }}
  jiraApiToken: ${{ secrets.JIRA_API_TOKEN }}
  actionName: 'addTagToJiraIssues'
  prefix: 'foo'
  jiraAdditionalTag: 'release'
```