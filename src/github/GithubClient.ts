import { Tag } from '../models/Tag';
import { getGithubAdapter } from './gihubAdapter';
import { GithubAdapter } from './types';
import { isNotFoundError } from './utils';

export interface IGithubClient {
  listSemVerTags: (
    shouldFetchAllTags?: boolean,
    page?: number,
  ) => Promise<Tag[]>;

  createBranch: (branchName: string) => Promise<void>;

  createTag: (tag: Tag) => Promise<void>;

  deleteBranch: (branch: string) => Promise<boolean>;

  checkBranchExists: (branch: string) => Promise<boolean>;
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

  async createBranch(branchName: string) {
    await this._githubAdapter.createRef(`refs/heads/${branchName}`);
  }

  async createTag(tag: Tag) {
    await this._githubAdapter.createRef(`refs/tags/${tag}`);
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

export function createGithubClient(githubToken: string): IGithubClient {
  return new GithubClient(getGithubAdapter(githubToken));
}
