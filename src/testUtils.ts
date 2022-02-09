import { GithubAdapter, ListTagsResponse } from './github/types';
import Mock = jest.Mock;

export type MockedGithubAdapter = {
  [P in keyof GithubAdapter]: Mock<
    ReturnType<GithubAdapter[P]>,
    Parameters<GithubAdapter[P]>
  >;
};

export function createMockGithubAdapter(
  tags: ListTagsResponse,
): MockedGithubAdapter {
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
