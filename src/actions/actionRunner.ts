import { IGithubClient } from '../github/GithubClient';
import { AutoIncrementPatch } from '../services/autoIncrementPatch';
import { MakePrerelease } from '../services/makePrerelease';
import { MakeRelease } from '../services/makeRelease';
import { ActionName, Equals, Inputs } from '../types';
import { assertUnreachable } from '../utils';
import { ActionAdapter } from './actionAdapter';
import { autoIncrementPatch } from './autoIncrementPatch';
import { makePrerelease } from './makePrerelease';
import { makeRelease } from './makeRelease';

export type Actions = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
  makeRelease: MakeRelease;
};

// * This type checks that Actions have all keys from ActionName
// * if you add new value into
// * ActionName or removed/renamed exiting one,
// * TS will fail on this type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Checker<T extends Equals<keyof Actions, ActionName> = true> = true;

export type ActionRunnerParams = {
  githubClient: IGithubClient;
  actions: Actions;
  actionAdapter: ActionAdapter;
};

export async function runAction({
  actions,
  actionAdapter,
  githubClient,
}: ActionRunnerParams) {
  const { setFailed, getInput } = actionAdapter;
  try {
    const actionName = getInput(Inputs.actionName, {
      required: true,
    }) as ActionName;
    switch (actionName) {
      case 'autoIncrementPatch': {
        return await autoIncrementPatch({
          githubClient,
          actionAdapter,
          autoIncrementPatchService: actions.autoIncrementPatch,
        });
      }
      case 'makePrerelease': {
        return await makePrerelease({
          githubClient,
          actionAdapter,
          makePrereleaseService: actions.makePrerelease,
        });
      }
      case 'makeRelease': {
        return await makeRelease({
          actionAdapter,
          githubClient,
          makeReleaseService: actions.makeRelease,
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
