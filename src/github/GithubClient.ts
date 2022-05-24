import { Tag } from '../models/Tag';
import { Commit, GithubAdapter, GithubTag } from './types';
import { fetchPages, isNotFoundError } from './utils';

export interface IGithubClient {
  listSemVerTags: (
    shouldFetchAllTags?: boolean,
    page?: number,
  ) => Promise<Tag[]>;

  createBranch: (branchName: string, sha: string) => Promise<void>;

  createTag: (tag: Tag, sha: string) => Promise<void>;

  deleteBranch: (branch: string) => Promise<boolean>;

  checkBranchExists: (branch: string) => Promise<boolean>;

  getTag: (tag: string) => Promise<GithubTag | undefined>;

  compareTags: (baseTag: Tag, headTag: Tag) => Promise<Commit[]>;
}

export class GithubClient implements IGithubClient {
  private _githubAdapter: GithubAdapter;

  constructor(githubAdapter: GithubAdapter) {
    this._githubAdapter = githubAdapter;
  }

  async listSemVerTags(shouldFetchAllTags = true, page = 1) {
    return fetchPages({
      shouldFetchAll: shouldFetchAllTags,
      fetchFn: this._githubAdapter.listTags,
      initialPage: page,
    }).then((tags) => {
      return tags
        .map((tag) => Tag.parse(tag.name))
        .filter((tag): tag is Tag => tag != null);
    });
  }

  async compareTags(baseTag: Tag, headTag: Tag) {
    return fetchPages({
      shouldFetchAll: true,
      fetchFn: async ({ per_page, page }) =>
        this._githubAdapter.compareRefs({
          per_page,
          page,
          headRef: headTag.value,
          baseRef: baseTag.value,
        }),
      initialPage: 1,
    });
  }

  async createBranch(branchName: string, sha: string) {
    await this._githubAdapter.createRef(`refs/heads/${branchName}`, sha);
  }

  async createTag(tag: Tag, sha: string) {
    await this._githubAdapter.createRef(`refs/tags/${tag}`, sha);
  }

  async getTag(tag: string) {
    const parsedTag = Tag.parse(tag);
    if (!parsedTag) {
      return undefined;
    }
    try {
      const ref = await this._githubAdapter.getRef(`tags/${tag}`);
      return {
        value: parsedTag,
        sha: ref.object.sha,
      };
    } catch (e) {
      if (isNotFoundError(e)) {
        return undefined;
      }
      throw e;
    }
  }

  async checkBranchExists(branchName: string) {
    return this._githubAdapter
      .getBranch(branchName)
      .then(() => true)
      .catch((error) => {
        if (isNotFoundError(error)) {
          return false;
        }
        throw error;
      });
  }

  async deleteBranch(branchName: string) {
    return this._githubAdapter
      .deleteRef(`refs/heads/${branchName}`)
      .then(() => true)
      .catch((error) => {
        if (isNotFoundError(error)) {
          return false;
        }
        throw error;
      });
  }
}
