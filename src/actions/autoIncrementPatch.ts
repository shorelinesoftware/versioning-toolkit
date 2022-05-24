import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type AutoIncrementPatchParams = {
  githubClient: IGithubClient;
  prefix: string;
  pushTag: boolean;
  sha: string;
};

export async function autoIncrementPatch({
  prefix,
  githubClient,
  pushTag,
  sha,
}: AutoIncrementPatchParams) {
  const tags = await githubClient.listSemVerTags();
  const prefixOrBranch = getBranchName(prefix);

  const prevTag = Tag.getHighestTagWithPrefixOrDefault(tags, prefixOrBranch);
  if (prevTag == null) {
    return undefined;
  }
  const newTag = prevTag.bumpPatchSegment();
  if (pushTag) {
    await githubClient.createTag(newTag, sha);
  }
  return newTag;
}

export type AutoIncrementPatch = typeof autoIncrementPatch;
