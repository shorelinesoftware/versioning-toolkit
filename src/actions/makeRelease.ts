import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';

export type CreateReleaseParams = {
  githubClient: IGithubClient;
  rowMajorSegment?: string;
  rowMinorSegment?: string;
  releasePrefix: string;
  rowMainTag: string;
};

function parseSegment(segment: string | undefined) {
  return Number.parseInt(segment ?? '', 10) || undefined;
}

export type MakeRelease = typeof makeRelease;

export async function makeRelease({
  releasePrefix,
  githubClient,
  rowMainTag,
  rowMajorSegment,
  rowMinorSegment,
}: CreateReleaseParams) {
  if (!releasePrefix) {
    throw new Error('missing branchNamePrefix');
  }

  if (!rowMainTag) {
    throw new Error('missing baseTag');
  }

  const tags = await githubClient.listSemVerTags();

  const mainTag = await githubClient.getTag(rowMainTag);
  if (mainTag == null) {
    throw new Error(`Can not find tag ${mainTag} in repository`);
  }
  const { value: mainTagValue, sha } = mainTag;

  const minorSegment = parseSegment(rowMinorSegment);

  const majorSegment = parseSegment(rowMajorSegment);

  const prevReleaseTag = Tag.getHighestTagOrDefaultWithPrefix(
    tags,
    releasePrefix,
  );

  const newReleaseTag = new Tag({
    prefix: prevReleaseTag.prefix,
    version: {
      major: majorSegment ?? mainTagValue.majorSegment,
      minor: minorSegment ?? mainTagValue.minorSegment,
      patch:
        majorSegment != null || minorSegment != null
          ? 0
          : prevReleaseTag.bumpPatchSegment().patchSegment,
    },
  });

  const newMainTag = new Tag({
    prefix: mainTagValue.prefix,
    version: {
      major: majorSegment ?? mainTagValue.majorSegment,
      minor: (minorSegment ?? mainTagValue.minorSegment) + 1,
      patch: 0,
    },
  });

  const newBranch = `${releasePrefix}-${newReleaseTag.majorSegment}.${newReleaseTag.minorSegment}`;

  await githubClient.createTag(newReleaseTag, sha);
  await githubClient.createTag(newMainTag, sha);
  await githubClient.createBranch(newBranch, sha);
  return {
    newReleaseTag,
    newMainTag,
    newBranch,
  };
}
