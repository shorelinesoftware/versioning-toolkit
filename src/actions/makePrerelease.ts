import { IGithubClient } from '../github/GithubClient';
import { MakePrerelease } from '../services/makePrerelease';
import { Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';
import { processTag } from './utils';

export type MakePrereleaseParams = {
  githubClient: IGithubClient;
  actionAdapter: ActionAdapter;
  makePrereleaseService: MakePrerelease;
};

export async function makePrerelease({
  githubClient,
  actionAdapter,
  makePrereleaseService,
}: MakePrereleaseParams) {
  const { sha, getInput } = actionAdapter;
  const prefix = getInput(Inputs.prefix, { required: true });
  const pushTag = getInput(Inputs.push) === 'true';
  const newTag = await makePrereleaseService({
    githubClient,
    tagPrefix: prefix,
    sha,
    pushTag,
  });
  processTag(newTag, pushTag, actionAdapter);
  return;
}
