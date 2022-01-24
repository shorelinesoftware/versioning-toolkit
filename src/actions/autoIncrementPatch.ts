import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export async function autoIncrementPatch(
  githubClient: IGithubClient,
  branch: string,
) {
  const tags = await githubClient.listSemVerTags();
  const branchName = getBranchName(branch);

  const prevTag = Tag.getHighestTagOrDefault(tags, branchName);
  if (prevTag == null) {
    return undefined;
  }
  const newTag = prevTag.bumpPatchSegment();
  await githubClient.createTag(newTag);
  return newTag;
}

export type AutoIncrementPatch = typeof autoIncrementPatch;
