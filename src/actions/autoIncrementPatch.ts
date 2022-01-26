import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type AutoIncrementPatchParams = {
  githubClient: IGithubClient;
  branch: string;
  pushTag: boolean;
};

export async function autoIncrementPatch({
  branch,
  githubClient,
  pushTag,
}: AutoIncrementPatchParams) {
  const tags = await githubClient.listSemVerTags();
  const branchName = getBranchName(branch);

  const prevTag = Tag.getHighestTagOrDefaultWithPrefix(tags, branchName);
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
