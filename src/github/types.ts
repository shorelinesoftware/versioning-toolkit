import { components } from '@octokit/openapi-types';
import { Endpoints } from '@octokit/types';
import { Tag } from '../models/Tag';

export type ListRequestParams = {
  per_page: components['parameters']['per-page'];
  page: components['parameters']['page'];
};

export type GithubTag = {
  value: Tag;
  sha: string;
};

export type ListTagsResponse =
  Endpoints['GET /repos/{owner}/{repo}/tags']['response']['data'];

export type RefResponse =
  Endpoints['GET /repos/{owner}/{repo}/git/ref/{ref}']['response']['data'];

export type CompareRefsRequestParams = ListRequestParams & {
  baseRef: string;
  headRef: string;
};

export type Commit = {
  message: string;
  sha: string;
};

export type GithubAdapter = {
  listTags: (params: ListRequestParams) => Promise<ListTagsResponse>;
  createRef: (ref: string, sha: string) => Promise<void>;
  getBranch: (branch: string) => Promise<string>;
  deleteRef: (ref: string) => Promise<void>;
  getRef: (ref: string) => Promise<RefResponse>;
  compareRefs: (params: CompareRefsRequestParams) => Promise<Commit[]>;
};
