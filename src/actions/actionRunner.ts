import { IGithubClient } from '../github/GithubClient';
import { ServiceLocator } from '../services/serviceLocator';
import { ActionTypes, Inputs } from '../types';
import { assertUnreachable } from '../utils';
import { ActionAdapter } from './actionAdapter';
import { autoIncrementPatch } from './autoIncrementPatch';
import { makePrerelease } from './makePrerelease';
import { makeRelease } from './makeRelease';

export type ActionRunnerParams = {
  githubClient: IGithubClient;
  serviceLocator: ServiceLocator;
  actionAdapter: ActionAdapter;
};

export async function runAction({
  serviceLocator,
  actionAdapter,
  githubClient,
}: ActionRunnerParams) {
  const { setFailed, getInput } = actionAdapter;
  try {
    const actionName = getInput(Inputs.actionName, {
      required: true,
    }) as ActionTypes;
    switch (actionName) {
      case 'autoIncrementPatch': {
        return await autoIncrementPatch({
          githubClient,
          actionAdapter,
          autoIncrementPatchService: serviceLocator.autoIncrementPatch,
        });
      }
      case 'makePrerelease': {
        return await makePrerelease({
          githubClient,
          actionAdapter,
          makePrereleaseService: serviceLocator.makePrerelease,
        });
      }
      case 'makeRelease': {
        return await makeRelease({
          actionAdapter,
          githubClient,
          makeReleaseService: serviceLocator.makeRelease,
        });
      }
      default: {
        assertUnreachable(actionName);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error);
    }
  }
}
