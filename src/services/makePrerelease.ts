import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type MakePrereleaseParams = {
  githubClient: IGithubClient;
  tagPrefix: string;
  sha: string;
  pushTag: boolean;
};

export async function makePrerelease({
  githubClient,
  pushTag,
  sha,
  tagPrefix,
}: MakePrereleaseParams) {
  if (!tagPrefix) {
    throw new Error('missing tagPrefix');
  }
  const tags = await githubClient.listSemVerTags();
  const branchNameOrPrefix = getBranchName(tagPrefix);
  const shortSha = sha.substring(0, 7);
  let prevTag = Tag.getHighestTagWithPrefixOrDefault(tags, branchNameOrPrefix);

  if (prevTag?.isDefault()) {
    prevTag = prevTag.bumpPatchSegment();
  }
  const newTag = new Tag({
    prefix: prevTag.prefix,
    version: `${prevTag.version}-${shortSha}`,
  });
  if (pushTag) {
    await githubClient.createTag(newTag, sha);
  }
  return newTag;
}

export type MakePrerelease = typeof makePrerelease;
