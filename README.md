<p align="center">
  <a href="https://github.com/shorelinesoftware/versioning-toolkit"><img alt="typescript-action status" src="https://github.com/shorelinesoftware/versioning-toolkit/workflows/build-test/badge.svg"></a>
</p>

# Versioning-toolkit GitHub action

This action provides a set of helpers for semantic versioning:

1) Auto increment patch version and push new tag
2) TBD

## Auto increment patch version and push new tag

##inputs 

### `branch`

**Required**. The name of the branch. Serves as the filter prefix to find tag with the highest version.  
For example:
If there are these tags: master-0.0.1, master-0.0.2, release-1.0.0, release-1.0.1, release-2.0.1 and provided branch is **release-1.0** then the new tag will be **release-1.0.2**.  
If there are no tags that match the **branch** the tag name will be **{branch}-0.0.1**

### `actionName`

**Required** The name of the helper method. Must be **autoIncrementPatch**


## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action

```yaml
uses: shorelinesoftware/versioning-toolkit@v0.0.1
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
  branch: 'master'
  actionName: 'autoIncrementPatch'
  
```