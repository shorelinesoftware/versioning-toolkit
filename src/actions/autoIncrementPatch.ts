import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type AutoIncrementPatchParams = {
  githubClient: IGithubClient;
  prefix: string;
  push: boolean;
  sha: string;
};

export async function autoIncrementPatch({
  prefix,
  githubClient,
  push,
  sha,
}: AutoIncrementPatchParams) {
  const tags = await githubClient.listSemVerTags();
  const prefixOrBranch = getBranchName(prefix);

  const prevTag = Tag.getHighestTagOrDefaultWithPrefix(tags, prefixOrBranch);
  if (prevTag == null) {
    return undefined;
  }
  const newTag = prevTag.bumpPatchSegment();
  if (push) {
    await githubClient.createTag(newTag, sha);
  }
  return newTag;
}

export type AutoIncrementPatch = typeof autoIncrementPatch;
