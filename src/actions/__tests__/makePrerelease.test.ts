import { IGithubClient } from '../../github/GithubClient';
import { Tag } from '../../models/Tag';
import { makePrerelease } from '../makePrerelease';

describe('makePrerelease', () => {
  const tags: Tag[] = [];
  const sha = '1ae1b19044adfe98998f4e1ab04da2e698cce6df';
  const shortSha = '1ae1b19';

  const githubClient: IGithubClient = {
    createTag: jest.fn<Promise<void>, [Tag]>(),
    listSemVerTags: async () => Promise.resolve(tags),
    createBranch: jest.fn<Promise<void>, [string]>(),
  };
  it('pushes new tag when pushTag is true', async () => {
    const newTag = await makePrerelease({
      githubClient,
      tagPrefix: 'refs/heads/feature-1.0',
      sha,
      pushTag: true,
    });
    expect(githubClient.createTag).toHaveBeenCalledWith(newTag);
  });
  it('does not push new tag when pushTag is false', async () => {
    await makePrerelease({
      githubClient,
      tagPrefix: 'refs/heads/feature-1.0',
      sha,
      pushTag: false,
    });
    expect(githubClient.createTag).not.toBeCalled();
  });
  it.each([
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
        githubClient,
        tagPrefix: prefix,
        sha,
        pushTag: false,
      });
      expect(tag.value).toBe(expected);
    },
  );
  it('throws exception when missing prefix', async () => {
    expect(async () =>
      makePrerelease({
        githubClient,
        tagPrefix: '',
        sha,
        pushTag: false,
      }),
    ).rejects.toThrow();
  });
});
