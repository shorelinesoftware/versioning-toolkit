import { Tag } from '../models/Tag';
import { GithubAdapter, GithubTag } from './types';
import { isNotFoundError } from './utils';

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
}

export class GithubClient implements IGithubClient {
  private _githubAdapter: GithubAdapter;

  constructor(githubAdapter: GithubAdapter) {
    this._githubAdapter = githubAdapter;
  }

  async listSemVerTags(shouldFetchAllTags = true, page = 1) {
    return this._listSemVerTags(shouldFetchAllTags, [], page).then(
      (tags) => tags ?? [],
    );
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
      const ref = await this._githubAdapter.getRef(`refs/tags/${tag}`);
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

  private async _listSemVerTags(
    shouldFetchAllTags = false,
    fetchedTags: Tag[] = [],
    page = 1,
  ): Promise<Tag[]> {
    const perPage = 100;

    const tagsResponse = await this._githubAdapter.listTags({
      per_page: perPage,
      page,
    });
    const tags = tagsResponse
      .map((tag) => Tag.parse(tag.name))
      .filter((tag): tag is Tag => tag != null);
    if (tagsResponse.length < perPage || !shouldFetchAllTags) {
      return [...fetchedTags, ...tags];
    }

    return this._listSemVerTags(
      shouldFetchAllTags,
      [...fetchedTags, ...tags],
      page + 1,
    );
  }
}
