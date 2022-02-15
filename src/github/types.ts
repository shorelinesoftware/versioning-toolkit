import { components } from '@octokit/openapi-types';
import { Endpoints } from '@octokit/types';
import { Tag } from '../models/Tag';

type ListTagsParams = {
  per_page?: components['parameters']['per-page'];
  page?: components['parameters']['page'];
};

export type GithubTag = {
  value: Tag;
  sha: string;
};

export type ListTagsResponse =
  Endpoints['GET /repos/{owner}/{repo}/tags']['response']['data'];

export type RefResponse =
  Endpoints['GET /repos/{owner}/{repo}/git/ref/{ref}']['response']['data'];

export type GithubAdapter = {
  listTags: (params: ListTagsParams) => Promise<ListTagsResponse>;
  createRef: (ref: string, sha: string) => Promise<void>;
  getBranch: (branch: string) => Promise<string>;
  deleteRef: (ref: string) => Promise<void>;
  getRef: (ref: string) => Promise<RefResponse>;
};
