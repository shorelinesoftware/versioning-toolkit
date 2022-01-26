import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { ActionName, Equals, Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';
import { AutoIncrementPatch } from './autoIncrementPatch';
import { MakePrerelease } from './makePrerelease';

export type Actions = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
};

// * This type checks that Actions have all keys from ActionName
// * if you add new value into
// * ActionName or removed/renamed exiting one,
// * TS will fail on this type.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Checker<T extends Equals<keyof Actions, ActionName> = true> = true;

export class Action {
  private readonly _githubClient: IGithubClient;
  private readonly _actionAdapter: ActionAdapter;
  private readonly _actions: Actions;
  constructor(
    githubClient: IGithubClient,
    actionsAdapter: ActionAdapter,
    actions: Actions,
  ) {
    this._actionAdapter = actionsAdapter;
    this._githubClient = githubClient;
    this._actions = actions;
  }

  private processTag(newTag: Tag, isTagPushed: boolean) {
    const { info, setOutput } = this._actionAdapter;
    info(`new tag: ${newTag}`);
    if (isTagPushed) {
      info(`pushed new tag ${newTag}`);
    }
    setOutput('NEW_TAG', newTag.value);
  }

  async run() {
    const { setFailed, info, getInput } = this._actionAdapter;
    try {
      const actionName = getInput(Inputs.actionName, { required: true });
      const pushTag = getInput(Inputs.pushTag, { required: false }) === 'true';
      switch (actionName as ActionName) {
        case 'autoIncrementPatch': {
          const branch = getInput(Inputs.branch, { required: true });

          const newTag = await this._actions.autoIncrementPatch({
            githubClient: this._githubClient,
            branch,
            pushTag,
          });
          if (newTag == null) {
            info(`can't make a new tag from ${branch}`);
            return;
          }
          this.processTag(newTag, pushTag);
          return;
        }
        case 'makePrerelease': {
          const prefix = getInput(Inputs.prefix, { required: true });
          const newTag = await this._actions.makePrerelease({
            githubClient: this._githubClient,
            tagPrefix: prefix,
            sha: this._actionAdapter.sha,
            pushTag,
          });
          this.processTag(newTag, pushTag);
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
