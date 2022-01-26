import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export async function makePrerelease(
  githubClient: IGithubClient,
  tagPrefix: string,
  sha: string,
) {
  const tags = await githubClient.listSemVerTags();
  const branchNameOrPrefix = getBranchName(tagPrefix);
  const shortSha = sha.substring(0, 7);
  let prevTag = Tag.getHighestTagOrDefault(tags, branchNameOrPrefix);
  if (prevTag == null) {
    return new Tag({
      prefix: branchNameOrPrefix,
      version: `0.0.1-${shortSha}`,
    });
  }
  if (prevTag.isDefault()) {
    prevTag = prevTag.bumpPatchSegment();
  }
  return new Tag({
    prefix: prevTag.prefix,
    version: `${prevTag.version}-${shortSha}`,
  });
}

export type MakePrerelease = typeof makePrerelease;
