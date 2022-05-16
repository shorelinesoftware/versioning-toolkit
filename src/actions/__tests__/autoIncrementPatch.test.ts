import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { autoIncrementPatch } from '../autoIncrementPatch';

describe('autoIncrementPatch', () => {
  const tags = [
    new Tag('master-0.0.0'),
    new Tag('master-0.1.1'),
    new Tag('master-0.1.0'),
    new Tag('master-1.1.0'),
    new Tag('master-0.0.1'),
    new Tag('stable-1.0.0'),
    new Tag('stable-2.0.0'),
    new Tag('stable-2.1.0'),
    new Tag('stable-2.2.0'),
    new Tag('stable-2.2.1'),
    new Tag('stable-2.2.2'),
    new Tag('stable-2.2.3'),
    new Tag('stable-2.3.0'),
    new Tag('stable-2.3.1'),
    new Tag('stable-0.1.0'),
  ];

  const mockedGithubClient: Mocked<IGithubClient> = {
    createTag: jest.fn<Promise<void>, [Tag, string]>(),
    listSemVerTags: jest.fn(async () => Promise.resolve(tags)),
    createBranch: jest.fn<Promise<void>, [string, string]>(),
    deleteBranch: jest.fn<Promise<boolean>, [string]>(),
    checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    getTag: jest.fn<Promise<GithubTag>, [string]>(),
  };

  const sha = '123';

  it('bumps patch version', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/master',
      pushTag: false,
      sha,
    });
    expect(newTag?.value).toBe('master-1.1.1');
  });
  it('returns undefined if cannot bump tag', async () => {
    mockedGithubClient.listSemVerTags.mockReturnValueOnce(Promise.resolve([]));
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: '',
      pushTag: false,
      sha,
    });
    expect(newTag).toBe(undefined);
  });
  it('bumps patch version if prefix is tag like branch', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/stable-2.3',
      pushTag: false,
      sha,
    });
    expect(newTag?.value).toBe('stable-2.3.2');
  });
  it('creates initial tag and bumps patch version when no previous tags', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/feature',
      pushTag: false,
      sha,
    });
    expect(newTag?.value).toBe('feature-0.0.1');
  });
  it('creates new tag with initial patch version when tag like branch name', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/feature-1.0',
      pushTag: false,
      sha,
    });
    expect(newTag?.value).toBe('feature-1.0.1');
  });
  it('pushes new tag when push is true', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/feature-1.0',
      pushTag: true,
      sha,
    });
    expect(mockedGithubClient.createTag).toHaveBeenCalledWith(newTag, sha);
  });
  it('does not push new tag when push is false', async () => {
    await autoIncrementPatch({
      githubClient: mockedGithubClient,
      prefix: 'refs/heads/feature-1.0',
      pushTag: false,
      sha,
    });
    expect(mockedGithubClient.createTag).not.toBeCalled();
  });
});
