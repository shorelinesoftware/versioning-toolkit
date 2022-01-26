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
    'makes prerelease tag $expected from prefix $prefix',
    async ({ prefix, expected }) => {
      const tag = await makePrerelease(githubClient, prefix, sha);
      expect(tag.value).toBe(expected);
    },
  );
});
