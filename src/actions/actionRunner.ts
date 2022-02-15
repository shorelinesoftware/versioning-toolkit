import { IGithubClient } from '../github/GithubClient';
import { Tag } from '../models/Tag';
import { ActionName, Equals, Inputs } from '../types';
import { assertUnreachable } from '../utils';
import { ActionAdapter } from './actionAdapter';
import { AutoIncrementPatch } from './autoIncrementPatch';
import { MakePrerelease } from './makePrerelease';
import { MakeRelease } from './makeRelease';

export type Actions = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
  createRelease: MakeRelease;
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
  const processTag = (newTag: Tag, isTagPushed: boolean) => {
    const { info, setOutput } = actionAdapter;
    info(`new tag: ${newTag}`);
    if (isTagPushed) {
      info(`pushed new tag ${newTag}`);
    }
    setOutput('NEW_TAG', newTag.value);
  };

  const { setFailed, info, getInput } = actionAdapter;
  try {
    const actionName = getInput(Inputs.actionName, {
      required: true,
    }) as ActionName;
    const pushTag = getInput(Inputs.pushTag, { required: false }) === 'true';
    switch (actionName) {
      case 'autoIncrementPatch': {
        const prefix = getInput(Inputs.prefix, { required: true });

        const newTag = await actions.autoIncrementPatch({
          githubClient,
          prefix,
          pushTag,
          sha: actionAdapter.sha,
        });
        if (newTag == null) {
          info(`can't make a new tag from ${prefix}`);
          return;
        }
        processTag(newTag, pushTag);
        return;
      }
      case 'makePrerelease': {
        const prefix = getInput(Inputs.prefix, { required: true });
        const newTag = await actions.makePrerelease({
          githubClient,
          tagPrefix: prefix,
          sha: actionAdapter.sha,
          pushTag,
        });
        processTag(newTag, pushTag);
        return;
      }
      case 'createRelease': {
        const releasePrefix = getInput(Inputs.releasePrefix, {
          required: true,
        });
        const mainTag = getInput(Inputs.mainTag, { required: true });
        const minorSegment = getInput(Inputs.minorSegment);
        const majorSegment = getInput(Inputs.majorSegment);
        await actions.createRelease({
          releasePrefix,
          githubClient,
          rowMainTag: mainTag,
          rowMajorSegment: majorSegment,
          rowMinorSegment: minorSegment,
        });
        return;
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
