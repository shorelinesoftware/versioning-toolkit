import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { GithubClient } from '../GithubClient';
import {
  GithubAdapter,
  ListTagsResponse,
  RefResponse,
  Commit,
  ListRequestParams,
} from '../types';

const PER_PAGE = 100;
const TOTAL_TAGS = PER_PAGE * 2;
const TOTAL_COMMITS = PER_PAGE * 2;

function paginate<TListItem, TRequestParams extends ListRequestParams>(
  list: TListItem[],
) {
  return async ({ page = 1, per_page }: TRequestParams) => {
    if (per_page == null) {
      return Promise.resolve(list);
    }
    return Promise.resolve(list.slice(page * per_page, (page + 1) * per_page));
  };
}

function createMockGithubAdapter(
  tags: ListTagsResponse,
  commits: Commit[],
): Mocked<GithubAdapter> {
  return {
    listTags: jest.fn(paginate(tags)),
    createRef: jest.fn<Promise<void>, [string, string]>(),
    getBranch: jest.fn<Promise<string>, [string]>(),
    deleteRef: jest.fn<Promise<void>, [string]>(),
    getRef: jest.fn<Promise<RefResponse>, [string]>(),
    compareRefs: jest.fn(paginate(commits)),
  };
}

const defaultTags = [
  ...[...new Array(TOTAL_TAGS).keys()].map((_, index) => ({
    name: `master-0.0.${index}`,
    commit: { sha: 'string', url: 'string' },
    zipball_url: 'string',
    tarball_url: 'string',
    node_id: 'string',
  })),
  {
    name: `badTag`,
    commit: { sha: 'string', url: 'string' },
    zipball_url: 'string',
    tarball_url: 'string',
    node_id: 'string',
  },
];

const defaultCommits: Commit[] = [
  ...[...new Array(TOTAL_TAGS).keys()].map((_, index) => ({
    sha: `sha-${index}`,
    message: `commit-${index}`,
  })),
];

describe('GithubClient', () => {
  const mockedGithubAdapter = createMockGithubAdapter(
    defaultTags,
    defaultCommits,
  );
  const githubClient = new GithubClient(mockedGithubAdapter);
  describe('listSemVerTags', () => {
    it('should load first page only', async () => {
      const tags = await githubClient.listSemVerTags(false);
      expect(tags.length).toBe(PER_PAGE);
      expect(tags[PER_PAGE - 1].value).toBe(`master-0.0.${PER_PAGE - 1}`);
    });
    it('should load all tags', async () => {
      const tags = await githubClient.listSemVerTags(true);
      expect(tags.length).toBe(TOTAL_TAGS);
    });
    it('should load all tags by default', async () => {
      const tags = await githubClient.listSemVerTags();
      expect(tags.length).toBe(TOTAL_TAGS);
    });
    it('should filter out bad tags', async () => {
      const tags = await githubClient.listSemVerTags(true);
      expect(tags.every((t) => t != null)).toBe(true);
    });
  });
  describe('compareTags', () => {
    it('should load all commits', async () => {
      const commits = await githubClient.compareTags(
        new Tag('master-0.0.1'),
        new Tag('master-0.0.2'),
      );
      expect(commits.length).toBe(TOTAL_COMMITS);
    });
  });
  describe('createTag', () => {
    const sha = '123';
    it('constructs ref the right way', () => {
      const tag = Tag.parse('master-0.0.1');
      if (tag == null) {
        throw new Error(`tag master-0.0.1 can't be parsed`);
      }
      githubClient.createTag(tag, sha);
      expect(mockedGithubAdapter.createRef).toHaveBeenCalledWith(
        `refs/tags/${tag}`,
        sha,
      );
    });
  });
  describe('createBranch', () => {
    const sha = '123';
    it('constructs ref the right way', () => {
      const branch = 'master-0.1';
      githubClient.createBranch(branch, sha);
      expect(mockedGithubAdapter.createRef).toHaveBeenCalledWith(
        `refs/heads/${branch}`,
        sha,
      );
    });
  });
  describe('checkBranchExists', () => {
    it('returns true when branch exists', async () => {
      const branch = 'master-0.1';
      mockedGithubAdapter.getBranch.mockReturnValueOnce(
        Promise.resolve(branch),
      );
      const exists = await githubClient.checkBranchExists(branch);
      expect(exists).toBe(true);
    });
    it('returns false when branch does not exist', async () => {
      const branch = 'unknown';
      mockedGithubAdapter.getBranch.mockReturnValueOnce(
        // eslint-disable-next-line prefer-promise-reject-errors
        Promise.reject({
          status: 404,
        }),
      );
      const exists = await githubClient.checkBranchExists(branch);
      expect(exists).toBe(false);
    });
    it('throws exception if error is unknown', async () => {
      const branch = 'unknown';
      mockedGithubAdapter.getBranch.mockReturnValueOnce(
        Promise.reject(new Error('')),
      );
      await expect(async () =>
        githubClient.checkBranchExists(branch),
      ).rejects.toThrow();
    });
  });
  describe('deleteBranch', () => {
    it('returns true when branch deleted', async () => {
      const branch = 'master';
      mockedGithubAdapter.deleteRef.mockReturnValueOnce(Promise.resolve());
      const exists = await githubClient.deleteBranch(branch);
      expect(mockedGithubAdapter.deleteRef).toHaveBeenCalledWith(
        `refs/heads/${branch}`,
      );
      expect(exists).toBe(true);
    });
    it('returns false when branch does not exist', async () => {
      const branch = 'unknown';
      mockedGithubAdapter.deleteRef.mockReturnValueOnce(
        // eslint-disable-next-line prefer-promise-reject-errors
        Promise.reject({
          status: 404,
        }),
      );
      const exists = await githubClient.deleteBranch(branch);
      expect(exists).toBe(false);
    });
    it('throws exception if error is unknown', async () => {
      const branch = 'unknown';
      mockedGithubAdapter.deleteRef.mockReturnValueOnce(
        Promise.reject(new Error('')),
      );
      await expect(async () =>
        githubClient.deleteBranch(branch),
      ).rejects.toThrow();
    });
  });
  describe('getTag', () => {
    it('returns tag if ref exists', async () => {
      const rawTag = 'master-1.0.1';
      const sha = '123';
      const ref = `tags/${rawTag}`;
      mockedGithubAdapter.getRef.mockReturnValueOnce(
        Promise.resolve({
          ref,
          node_id: '',
          url: '',
          object: {
            sha,
            type: 'commit',
            url: '',
          },
        }),
      );
      const tag = await githubClient.getTag(rawTag);
      expect(tag).toEqual({
        value: new Tag(rawTag),
        sha,
      });
      expect(mockedGithubAdapter.getRef).toHaveBeenCalledWith(ref);
    });
    it('returns undefined if provided tag cannot be parsed', async () => {
      const tag = await githubClient.getTag('123');
      expect(tag).toBeUndefined();
      expect(mockedGithubAdapter.getRef).not.toHaveBeenCalled();
    });
    it('returns undefined if not found error is thrown', async () => {
      mockedGithubAdapter.getRef.mockReturnValueOnce(
        // eslint-disable-next-line prefer-promise-reject-errors
        Promise.reject({
          status: 404,
        }),
      );
      const tag = await githubClient.getTag('master-1.0.1');

      expect(tag).toBeUndefined();
    });
    it('throws exception if error is unknown', async () => {
      mockedGithubAdapter.getRef.mockReturnValueOnce(
        Promise.reject(new Error('')),
      );
      await expect(async () =>
        githubClient.getTag('master-1.0.1'),
      ).rejects.toThrow();
    });
  });
});
