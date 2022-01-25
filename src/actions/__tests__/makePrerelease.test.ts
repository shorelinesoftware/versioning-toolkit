import { IGithubClient } from '../../github/GithubClient';
import { Tag } from '../../models/Tag';
import { makePrerelease } from '../makePrerelease';

describe('makePreRelease', () => {
  const githubClient: IGithubClient = {
    createTag: jest.fn<Promise<void>, [Tag]>(),
    listSemVerTags: async () => Promise.resolve([]),
    createBranch: jest.fn<Promise<void>, [string]>(),
  };
  it('makes prerelease tag', async () => {
    const tag = await makePrerelease(githubClient, 'feature-foo', '123');
    const expectedTag = new Tag('feature-foo-0.0.1-123');
    expect(tag).toStrictEqual(expectedTag);
  });
});
