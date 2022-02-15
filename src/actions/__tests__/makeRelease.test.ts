import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { makeRelease } from '../makeRelease';

describe('make release', () => {
  const sha = '1ae1b19044adfe98998f4e1ab04da2e698cce6df';

  const mockedGithubClient: Mocked<IGithubClient> = {
    createTag: jest.fn<Promise<void>, [Tag, string]>(),
    listSemVerTags: jest.fn(),
    createBranch: jest.fn<Promise<void>, [string, string]>(),
    deleteBranch: jest.fn<Promise<boolean>, [string]>(),
    checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    getTag: jest.fn<Promise<GithubTag>, [string]>(),
  };
  it('throws exception if wrong arguments passed', async () => {
    await expect(async () =>
      makeRelease({
        releasePrefix: '',
        githubClient: mockedGithubClient,
        rowMainTag: 'stable-1.0.0',
      }),
    ).rejects.toThrow('missing releasePrefix');
    await expect(async () =>
      makeRelease({
        releasePrefix: 'stable',
        githubClient: mockedGithubClient,
        rowMainTag: '',
      }),
    ).rejects.toThrow('missing rowMainTag');
  });
  it('throws exception if cannot find main tag', async () => {
    const rowMainTag = 'master-10.1.1';
    await expect(async () =>
      makeRelease({
        releasePrefix: 'stable',
        githubClient: mockedGithubClient,
        rowMainTag,
      }),
    ).rejects.toThrow(`Can not find tag ${rowMainTag} in repository`);
  });
  it('creates release with the given release prefix', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
    });
    expect(release.newReleaseTag.value).toBe('release-0.1.1');
    expect(release.newReleaseBranch).toBe('release-0.1');
    expect(release.newMainTag.value).toBe('master-0.2.0');
    expect(mockedGithubClient.createTag).toHaveBeenNthCalledWith(
      1,
      release.newReleaseTag,
      sha,
    );
    expect(mockedGithubClient.createTag).toHaveBeenNthCalledWith(
      2,
      release.newMainTag,
      sha,
    );
    expect(mockedGithubClient.createBranch).toHaveBeenCalledWith(
      release.newReleaseBranch,
      sha,
    );
  });
  it('creates release with the given major segment', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );

    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMajorSegment: '10',
    });
    expect(release.newReleaseTag.value).toBe('release-10.1.0');
    expect(release.newReleaseBranch).toBe('release-10.1');
    expect(release.newMainTag.value).toBe('master-10.2.0');
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
    });
    expect(release.newReleaseTag.value).toBe('release-10.10.0');
    expect(release.newReleaseBranch).toBe('release-10.10');
    expect(release.newMainTag.value).toBe('master-10.11.0');
  });
  it('creates release with major and minor from main tag if passed segments can not be parsed', async () => {
    const mainTag = new Tag('master-0.1.1');
    mockedGithubClient.getTag.mockReturnValueOnce(
      Promise.resolve({ value: mainTag, sha }),
    );
    const release = await makeRelease({
      releasePrefix: 'release',
      githubClient: mockedGithubClient,
      rowMainTag: mainTag.value,
      rowMajorSegment: 'abc',
      rowMinorSegment: 'abc',
    });
    expect(release.newReleaseTag.value).toBe('release-0.1.1');
    expect(release.newReleaseBranch).toBe('release-0.1');
    expect(release.newMainTag.value).toBe('master-0.2.0');
  });
});
