import { components } from '@octokit/openapi-types';
import { Endpoints } from '@octokit/types';

type ListTagsParams = {
  per_page?: components['parameters']['per-page'];
  page?: components['parameters']['page'];
};

export type ListTagsResponse =
  Endpoints['GET /repos/{owner}/{repo}/tags']['response']['data'];

export type GithubAdapter = {
  listTags: (params: ListTagsParams) => Promise<ListTagsResponse>;
  createRef: (ref: string) => Promise<void>;
};
