import { IGithubClient } from '../github/GithubClient';
import { ActionName, Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';
import { AutoIncrementPatch } from './autoIncrementPatch';

export type ActionDictionary = {
  autoIncrementPatch: AutoIncrementPatch;
};

export class Action {
  private readonly _githubClient: IGithubClient;
  private readonly _actionAdapter: ActionAdapter;
  private readonly _actionDictionary: ActionDictionary;
  constructor(
    githubClient: IGithubClient,
    actionsAdapter: ActionAdapter,
    actionDictionary: ActionDictionary,
  ) {
    this._actionAdapter = actionsAdapter;
    this._githubClient = githubClient;
    this._actionDictionary = actionDictionary;
  }

  async run() {
    const { setFailed, info, getInput, setOutput } = this._actionAdapter;
    try {
      const actionName = getInput(Inputs.actionName, { required: true });
      const branch = getInput(Inputs.branch, { required: true });
      switch (actionName as ActionName) {
        case 'autoIncrementPatch': {
          const newTag = await this._actionDictionary.autoIncrementPatch(
            this._githubClient,
            branch,
          );
          if (newTag == null) {
            info(`can't make a new tag from ${branch}`);
            return;
          }
          info(`pushed new tag ${newTag}`);
          setOutput('NEW_TAG', newTag.value);
          return;
        }
        default: {
          throw new Error(`${actionName} is unknown`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setFailed(error);
      }
    }
  }
}
