import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import {
  AssertToHaveBeenAnyNthCalledWithParams,
  Mocked,
} from '../../testUtils';
import { makeRelease } from '../makeRelease';

describe('make release', () => {
  const sha = '1ae1b19044adfe98998f4e1ab04da2e698cce6df';
  beforeEach(() => {
    jest.resetAllMocks();
  });
  const mockedGithubClient: Mocked<IGithubClient> = {
    createTag: jest.fn<Promise<void>, [Tag, string]>(),
    listSemVerTags: jest.fn(),
    createBranch: jest.fn<Promise<void>, [string, string]>(),
    deleteBranch: jest.fn<Promise<boolean>, [string]>(),
    checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    getTag: jest.fn<Promise<GithubTag>, [string]>(),
    compareTags: jest.fn(async (_baseTag, _headTag) => Promise.resolve([])),
  };
  it('throws exception if release prefix is empty', async () => {
    await expect(async () =>
      makeRelease({
        releasePrefix: '',
        githubClient: mockedGithubClient,
        rowMainTag: 'stable-1.0.0',
        push: true,
      }),
    ).rejects.toThrow('missing releasePrefix');
  });
  it('throws exception if rowMainTag main tag is empty', async () => {
    await expect(async () =>
      makeRelease({
        releasePrefix: 'stable',
        githubClient: mockedGithubClient,
        rowMainTag: '',
        push: true,
      }),
    ).rejects.toThrow('missing rowMainTag');
  });
  it('throws exception if cannot find main tag', async () => {
    let rowMainTag = 'master-10.1.1';
    await expect(async () =>
      makeRelease({
        releasePrefix: 'stable',
        githubClient: mockedGithubClient,
        rowMainTag,
        push: true,
      }),
    ).rejects.toThrow(`Can not find tag ${rowMainTag} in repository`);
    rowMainTag = '123';
    await expect(async () =>
      makeRelease({
        releasePrefix: 'stable',
        githubClient: mockedGithubClient,
        rowMainTag,
        push: true,
      }),
    ).rejects.toThrow(`Can not find tag ${rowMainTag} in repository`);
  });

  it('throws exception if rowMajorSegment or  rowMinorSegment can not be parsed', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    await expect(async () =>
      makeRelease({
        releasePrefix: 'release',
        githubClient: mockedGithubClient,
        rowMainTag: mainTag.value,
        rowMajorSegment: 'abc',
        rowMinorSegment: '1',
        push: true,
      }),
    ).rejects.toThrow('Minor or major segment can not be parsed');
    await expect(async () =>
      makeRelease({
        releasePrefix: 'release',
        githubClient: mockedGithubClient,
        rowMainTag: mainTag.value,
        rowMajorSegment: '1',
        rowMinorSegment: 'abc',
        push: true,
      }),
    ).rejects.toThrow('Minor or major segment can not be parsed');
  });

  it('creates release from the given main tag', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      push: true,
      rowMinorSegment: '',
      rowMajorSegment: '',
    });
    expect(release.newReleaseTag.value).toBe('release-0.1.0');
    expect(release.newReleaseBranch).toBe('release-0.1');
    expect(release.newMainTag.value).toBe('master-0.2.0');
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedGithubClient.createTag,
      release.newReleaseTag,
      sha,
    );
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedGithubClient.createTag,
      release.newMainTag,
      sha,
    );
    expect(mockedGithubClient.createBranch).toHaveBeenCalledWith(
      release.newReleaseBranch,
      sha,
    );
  });
  it('does not push changes if push is false', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      push: false,
    });
    expect(mockedGithubClient.createTag).not.toHaveBeenCalled();
    expect(mockedGithubClient.createBranch).not.toHaveBeenCalled();
  });
  it('creates release with the given major segment and zeroes patch and minor segments if major segment is new', async () => {
    const mainTag = new Tag('master-1.1.1');
    mockedGithubClient.getTag.mockReturnValue(
      Promise.resolve({ value: mainTag, sha }),
    );

    const release1 = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMajorSegment: '2',
      push: true,
    });
    expect(release1.newReleaseTag.value).toBe('release-2.0.0');
    expect(release1.newReleaseBranch).toBe('release-2.0');
    expect(release1.newMainTag.value).toBe('master-2.1.0');

    const release2 = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMajorSegment: '1',
      push: true,
    });
    expect(release2.newReleaseTag.value).toBe('release-1.1.0');
    expect(release2.newReleaseBranch).toBe('release-1.1');
    expect(release2.newMainTag.value).toBe('master-1.2.0');
  });
  it('creates release with the given minor segment', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMinorSegment: '10',
      push: true,
    });
    expect(release.newReleaseTag.value).toBe('release-0.10.0');
    expect(release.newReleaseBranch).toBe('release-0.10');
    expect(release.newMainTag.value).toBe('master-0.11.0');
  });
  it('creates release with the given major and minor segment', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );
    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMajorSegment: '10',
      rowMinorSegment: '10',
      push: true,
    });
    expect(release.newReleaseTag.value).toBe('release-10.10.0');
    expect(release.newReleaseBranch).toBe('release-10.10');
    expect(release.newMainTag.value).toBe('master-10.11.0');
  });
});
