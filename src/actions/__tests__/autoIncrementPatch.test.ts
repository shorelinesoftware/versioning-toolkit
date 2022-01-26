import { IGithubClient } from '../../github/GithubClient';
import { Tag } from '../../models/Tag';
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

  const defaultGithubClient: IGithubClient = {
    createTag: jest.fn<Promise<void>, [Tag]>(),
    listSemVerTags: async () => Promise.resolve(tags),
    createBranch: jest.fn<Promise<void>, [string]>(),
  };
  it('bumps patch version', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/master',
      pushTag: false,
    });
    expect(newTag?.value).toBe('master-1.1.1');
  });
  it('returns undefined if cannot bump tag', async () => {
    const githubClient: IGithubClient = {
      createTag: jest.fn<Promise<void>, [Tag]>(),
      listSemVerTags: async () => Promise.resolve([]),
      createBranch: jest.fn<Promise<void>, [string]>(),
    };
    const newTag = await autoIncrementPatch({
      githubClient,
      branch: '',
      pushTag: false,
    });
    expect(newTag).toBe(undefined);
  });
  it('bumps patch version of specific branch', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/stable-2.3',
      pushTag: false,
    });
    expect(newTag?.value).toBe('stable-2.3.2');
  });
  it('creates initial tag and bumps patch version when no previous tags', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/feature',
      pushTag: false,
    });
    expect(newTag?.value).toBe('feature-0.0.1');
  });
  it('creates new tag with initial patch version when tag like branch name', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/feature-1.0',
      pushTag: false,
    });
    expect(newTag?.value).toBe('feature-1.0.1');
  });
  it('pushes new tag when pushTag is true', async () => {
    const newTag = await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/feature-1.0',
      pushTag: true,
    });
    expect(defaultGithubClient.createTag).toHaveBeenCalledWith(newTag);
  });
  it('does not push new tag when pushTag is false', async () => {
    await autoIncrementPatch({
      githubClient: defaultGithubClient,
      branch: 'refs/heads/feature-1.0',
      pushTag: false,
    });
    expect(defaultGithubClient.createTag).not.toBeCalled();
  });
});
