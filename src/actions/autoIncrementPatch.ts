import { IGithubClient } from '../github/GithubClient';
import { AutoIncrementPatch } from '../services/autoIncrementPatch';
import { Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';
import { processTag } from './utils';

export type AutoIncrementPatchParams = {
  githubClient: IGithubClient;
  actionAdapter: ActionAdapter;
  autoIncrementPatchService: AutoIncrementPatch;
};

export async function autoIncrementPatch({
  githubClient,
  actionAdapter,
  autoIncrementPatchService,
}: AutoIncrementPatchParams) {
  const { info, getInput } = actionAdapter;

  const prefix = getInput(Inputs.prefix, { required: true });
  const pushTag = getInput(Inputs.push) === 'true';

  const newTag = await autoIncrementPatchService({
    githubClient,
    prefix,
    pushTag,
    sha: actionAdapter.sha,
  });
  if (newTag == null) {
    info(`can't make a new tag from ${prefix}`);
    return;
  }
  processTag(newTag, pushTag, actionAdapter);
  return;
}
