import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type AutoIncrementPatchParams = {
  githubClient: IGithubClient;
  prefix: string;
  pushTag: boolean;
};

export async function autoIncrementPatch({
  prefix,
  githubClient,
  pushTag,
}: AutoIncrementPatchParams) {
  const tags = await githubClient.listSemVerTags();
  const prefixOrBranch = getBranchName(prefix);

  const prevTag = Tag.getHighestTagOrDefaultWithPrefix(tags, prefixOrBranch);
  if (prevTag == null) {
    return undefined;
  }
  const newTag = prevTag.bumpPatchSegment();
  if (pushTag) {
    await githubClient.createTag(newTag);
  }
  return newTag;
}

export type AutoIncrementPatch = typeof autoIncrementPatch;
