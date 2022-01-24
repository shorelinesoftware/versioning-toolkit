import { GithubAdapter, ListTagsResponse } from './github/types';

export function createMockGithubAdapter(tags: ListTagsResponse): GithubAdapter {
  return {
    listTags: ({ page = 1, per_page }) => {
      if (per_page == null) {
        return Promise.resolve(tags);
      }
      return Promise.resolve(
        tags.slice((page - 1) * per_page, page * per_page)
      );
    },
    createRef: jest.fn<Promise<void>, [string]>()
  };
}
