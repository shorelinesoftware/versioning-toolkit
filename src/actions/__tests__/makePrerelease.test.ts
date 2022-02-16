import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { makePrerelease } from '../makePrerelease';

describe('makePrerelease', () => {
  const tags: Tag[] = [
    new Tag('stable-2.2.1'),
    new Tag('stable-2.2.2'),
    new Tag('stable-2.2.3'),
    new Tag('stable-2.3.0'),
    new Tag('stable-2.3.1'),
  ];
  const sha = '1ae1b19044adfe98998f4e1ab04da2e698cce6df';
  const shortSha = '1ae1b19';

  const mockedGithubClient: Mocked<IGithubClient> = {
    createTag: jest.fn<Promise<void>, [Tag, string]>(),
    listSemVerTags: jest.fn(async () => Promise.resolve(tags)),
    createBranch: jest.fn<Promise<void>, [string, string]>(),
    deleteBranch: jest.fn<Promise<boolean>, [string]>(),
    checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    getTag: jest.fn<Promise<GithubTag>, [string]>(),
  };
  it('pushes new tag when pushTag is true', async () => {
    const newTag = await makePrerelease({
      githubClient: mockedGithubClient,
      tagPrefix: 'refs/heads/feature-1.0',
      sha,
      pushTag: true,
    });
    expect(mockedGithubClient.createTag).toHaveBeenCalledWith(newTag, sha);
  });
  it('does not push new tag when pushTag is false', async () => {
    await makePrerelease({
      githubClient: mockedGithubClient,
      tagPrefix: 'refs/heads/feature-1.0',
      sha,
      pushTag: false,
    });
    expect(mockedGithubClient.createTag).not.toBeCalled();
  });
  it.each([
    {
      prefix: 'refs/heads/stable',
      expected: `stable-2.3.1-${shortSha}`,
    },
    {
      prefix: 'refs/heads/feature-1.0',
      expected: `feature-1.0.0-${shortSha}`,
    },
    {
      prefix: 'feature-foo',
      expected: `feature-foo-0.0.1-${shortSha}`,
    },
    {
      prefix: 'stable-2.2.3',
      expected: `stable-2.2.3-${shortSha}`,
    },
    {
      prefix: 'stable-3.0',
      expected: `stable-3.0.0-${shortSha}`,
    },
  ])(
    `makes prerelease tag $expected from prefix $prefix and sha ${sha}`,
    async ({ prefix, expected }) => {
      const tag = await makePrerelease({
        githubClient: mockedGithubClient,
        tagPrefix: prefix,
        sha,
        pushTag: false,
      });
      expect(tag.value).toBe(expected);
    },
  );
  it('throws exception when missing prefix', async () => {
    await expect(async () =>
      makePrerelease({
        githubClient: mockedGithubClient,
        tagPrefix: '',
        sha,
        pushTag: false,
      }),
    ).rejects.toThrow('missing tagPrefix');
  });
});
