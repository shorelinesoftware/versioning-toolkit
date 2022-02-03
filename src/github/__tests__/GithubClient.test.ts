import { Tag } from '../../models/Tag';
import { createMockGithubAdapter } from '../../testUtils';
import { GithubClient } from '../GithubClient';

const TOTAL_TAGS = 2000;
// const PER_PAGE = 1000;

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
  // describe('listSemVerTags', () => {
  //   it('should load first page', async () => {
  //     const tags = await githubClient.listSemVerTags(false);
  //     expect(tags.length).toBe(PER_PAGE);
  //     expect(tags[PER_PAGE - 1].value).toBe(`master-0.0.${PER_PAGE - 1}`);
  //   });
  //   it('should load second page', async () => {
  //     const tags = await githubClient.listSemVerTags(false, 2);
  //     expect(tags.length).toBe(PER_PAGE);
  //     expect(tags[PER_PAGE - 1].value).toBe(`master-0.0.${TOTAL_TAGS - 1}`);
  //   });
  //   it('should load all tags', async () => {
  //     const tags = await githubClient.listSemVerTags(true);
  //     expect(tags.length).toBe(TOTAL_TAGS);
  //   });
  //   it('should filter out bad tags', async () => {
  //     const tags = await githubClient.listSemVerTags(true);
  //     expect(tags.every((t) => t != null)).toBe(true);
  //   });
  // });
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
});
