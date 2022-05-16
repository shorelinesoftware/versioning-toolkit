import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';

export type MakeReleaseParams = {
  githubClient: IGithubClient;
  rowMajorSegment?: string;
  rowMinorSegment?: string;
  releasePrefix: string;
  rowMainTag: string;
  push: boolean;
};

function parseSegment(segment: string | undefined) {
  if (segment == null) {
    return undefined;
  }
  return Number.parseInt(segment ?? '', 10);
}

function checkSegment(segment: number | undefined) {
  if (Number.isNaN(segment)) {
    throw new Error('Minor or major segment can not be parsed');
  }
}

export type MakeRelease = typeof makeRelease;

export async function makeRelease({
  releasePrefix,
  githubClient,
  rowMainTag,
  rowMajorSegment,
  rowMinorSegment,
  push,
}: MakeReleaseParams) {
  if (!releasePrefix) {
    throw new Error('missing releasePrefix');
  }

  if (!rowMainTag) {
    throw new Error('missing rowMainTag');
  }
  const minorSegment = parseSegment(rowMinorSegment);

  checkSegment(minorSegment);

  const majorSegment = parseSegment(rowMajorSegment);

  checkSegment(majorSegment);

  const mainTag = await githubClient.getTag(rowMainTag);
  if (mainTag == null) {
    throw new Error(`Can not find tag ${rowMainTag} in repository`);
  }
  const { value: mainTagValue, sha } = mainTag;

  let newMinorSegment = minorSegment ?? mainTagValue.minorSegment;
  if (
    minorSegment == null &&
    majorSegment != null &&
    majorSegment > mainTagValue.majorSegment
  ) {
    newMinorSegment = 0;
  }

  const newReleaseTag = new Tag({
    prefix: releasePrefix,
    version: {
      major: majorSegment ?? mainTagValue.majorSegment,
      minor: newMinorSegment,
      patch: 0,
    },
  });

  const newMainTag = new Tag({
    prefix: mainTagValue.prefix,
    version: {
      major: majorSegment ?? mainTagValue.majorSegment,
      minor: newMinorSegment + 1,
      patch: 0,
    },
  });

  const newReleaseBranch = newReleaseTag.createBranch();
  if (push) {
    await githubClient.createTag(newReleaseTag, sha);
    await githubClient.createTag(newMainTag, sha);
    await githubClient.createBranch(newReleaseBranch, sha);
  }

  return {
    newReleaseTag,
    newMainTag,
    newReleaseBranch,
  };
}
