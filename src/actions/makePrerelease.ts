import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';

export async function makePrerelease(
  githubClient: IGithubClient,
  tagPrefix: string,
  sha: string,
) {
  return new Tag({ prefix: tagPrefix, version: `0.0.1-${sha}` });
}

export type MakePrerelease = typeof makePrerelease;
