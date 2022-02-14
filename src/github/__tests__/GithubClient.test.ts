import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { GithubClient } from '../GithubClient';
import { GithubAdapter, ListTagsResponse } from '../types';

const PER_PAGE = 100;
const TOTAL_TAGS = PER_PAGE * 2;

function createMockGithubAdapter(
  tags: ListTagsResponse,
): Mocked<GithubAdapter> {
  return {
    listTags: jest.fn(async ({ page = 1, per_page }) => {
      if (per_page == null) {
        return Promise.resolve(tags);
      }
      return Promise.resolve(
        tags.slice((page - 1) * per_page, page * per_page),
      );
    }),
    createRef: jest.fn<Promise<void>, [string]>(),
    getBranch: jest.fn<Promise<string>, [string]>(),
    deleteRef: jest.fn<Promise<void>, [string]>(),
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

describe('GithubClient', () => {
  const githubAdapter = createMockGithubAdapter(defaultTags);
  const githubClient = new GithubClient(githubAdapter);
  describe('listSemVerTags', () => {
    it('should load first page', async () => {
      const tags = await githubClient.listSemVerTags(false);
      expect(tags.length).toBe(PER_PAGE);
      expect(tags[PER_PAGE - 1].value).toBe(`master-0.0.${PER_PAGE - 1}`);
    });
    it('should load second page', async () => {
      const tags = await githubClient.listSemVerTags(false, 2);
      expect(tags.length).toBe(PER_PAGE);
      expect(tags[PER_PAGE - 1].value).toBe(`master-0.0.${TOTAL_TAGS - 1}`);
    });
    it('should load all tags', async () => {
      const tags = await githubClient.listSemVerTags(true);
      expect(tags.length).toBe(TOTAL_TAGS);
    });
    it('should filter out bad tags', async () => {
      const tags = await githubClient.listSemVerTags(true);
      expect(tags.every((t) => t != null)).toBe(true);
    });
  });
  describe('createTag', () => {
    it('constructs ref the right way', () => {
      const tag = Tag.parse('master-0.0.1');
      if (tag == null) {
        throw new Error(`tag master-0.0.1 can't be parsed`);
      }
      githubClient.createTag(tag);
      expect(githubAdapter.createRef).toHaveBeenCalledWith(`refs/tags/${tag}`);
    });
  });
  describe('createBranch', () => {
    it('constructs ref the right way', () => {
      const branch = 'master-0.1';
      githubClient.createBranch(branch);
      expect(githubAdapter.createRef).toHaveBeenCalledWith(
        `refs/heads/${branch}`,
      );
    });
  });
  describe('checkBranchExists', () => {
    it('returns true when branch exists', async () => {
      const branch = 'master-0.1';
      githubAdapter.getBranch.mockReturnValueOnce(Promise.resolve(branch));
      const exists = await githubClient.checkBranchExists(branch);
      expect(exists).toBe(true);
    });
    it('returns false when branch does not exist', async () => {
      const branch = 'unknown';
      githubAdapter.getBranch.mockReturnValueOnce(
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
      githubAdapter.getBranch.mockReturnValueOnce(
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
      githubAdapter.deleteRef.mockReturnValueOnce(Promise.resolve());
      const exists = await githubClient.deleteBranch(branch);
      expect(githubAdapter.deleteRef).toHaveBeenCalledWith(
        `refs/heads/${branch}`,
      );
      expect(exists).toBe(true);
    });
    it('returns false when branch does not exist', async () => {
      const branch = 'unknown';
      githubAdapter.deleteRef.mockReturnValueOnce(
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
      githubAdapter.deleteRef.mockReturnValueOnce(
        Promise.reject(new Error('')),
      );
      await expect(async () =>
        githubClient.deleteBranch(branch),
      ).rejects.toThrow();
    });
  });
});
