import { Tag } from '../models/Tag';
import { getGithubAdapter } from './gihubAdapter';
import { GithubAdapter } from './types';

export interface IGithubClient {
  listSemVerTags: (
    shouldFetchAllTags?: boolean,
    page?: number,
  ) => Promise<Tag[]>;

  createBranch: (branchName: string) => Promise<void>;

  createTag: (tag: Tag) => Promise<void>;
}

export class GithubClient implements IGithubClient {
  private _githubAdapter: GithubAdapter;

  constructor(githubAdapter: GithubAdapter) {
    this._githubAdapter = githubAdapter;
  }

  async listSemVerTags(shouldFetchAllTags = false, page = 1) {
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

  private async _listSemVerTags(
    shouldFetchAllTags = false,
    fetchedTags: Tag[] = [],
    page = 1,
  ): Promise<Tag[]> {
    const perPage = 1000;

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
