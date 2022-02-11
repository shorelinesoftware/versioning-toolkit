import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { getBranchName } from '../utils';

export type CreateReleaseParams = {
  githubClient: IGithubClient;
  rowMajorSegment?: string;
  rowMinorSegment?: string;
  releaseBranchNamePrefix: string;
  mainBranchRawName: string;
};

function parseSegment(segment: string | undefined) {
  return Number.parseInt(segment ?? '', 10) || undefined;
}

export type CreateRelease = typeof createRelease;

export async function createRelease({
  releaseBranchNamePrefix,
  githubClient,
  mainBranchRawName,
  rowMajorSegment,
  rowMinorSegment,
}: CreateReleaseParams) {
  if (releaseBranchNamePrefix) {
    throw new Error('missing branchNamePrefix');
  }
  const tags = await githubClient.listSemVerTags();

  const minorSegment = parseSegment(rowMinorSegment);

  const majorSegment = parseSegment(rowMajorSegment);

  const prevReleaseTag = Tag.getHighestTagOrDefaultWithPrefix(
    tags,
    releaseBranchNamePrefix,
  );

  const mainTag = Tag.getHighestTagOrDefaultWithPrefix(
    tags,
    getBranchName(mainBranchRawName),
  );

  const newReleaseTag = new Tag({
    prefix: prevReleaseTag.prefix,
    version: {
      major: majorSegment ?? mainTag.majorSegment,
      minor: minorSegment ?? mainTag.minorSegment,
      patch: 0,
    },
  });

  const newMainTag = new Tag({
    prefix: mainTag.prefix,
    version: {
      major: majorSegment ?? mainTag.majorSegment,
      minor: minorSegment ?? mainTag.minorSegment + 1,
      patch: 0,
    },
  });
  await githubClient.createTag(newReleaseTag);
  await githubClient.createTag(newMainTag);
  await githubClient.createBranch(
    `${releaseBranchNamePrefix}-${newReleaseTag.majorSegment}.${newReleaseTag.minorSegment}`,
  );
}
