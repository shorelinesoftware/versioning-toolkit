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
  const { setFailed, info, getInput, setOutput } = actionAdapter;

  const processTag = (newTag: Tag, isTagPushed: boolean) => {
    info(`new tag: ${newTag}`);
    if (isTagPushed) {
      info(`pushed new tag ${newTag}`);
    }
    setOutput('NEW_TAG', newTag.value);
  };
  try {
    const actionName = getInput(Inputs.actionName, {
      required: true,
    }) as ActionName;
    switch (actionName) {
      case 'autoIncrementPatch': {
        const prefix = getInput(Inputs.prefix, { required: true });
        const pushTag = getInput(Inputs.push) === 'true';

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
        const pushTag = getInput(Inputs.push) === 'true';
        const newTag = await actions.makePrerelease({
          githubClient,
          tagPrefix: prefix,
          sha: actionAdapter.sha,
          pushTag,
        });
        processTag(newTag, pushTag);
        return;
      }
      case 'makeRelease': {
        const releasePrefix = getInput(Inputs.releasePrefix, {
          required: true,
        });
        const mainTag = getInput(Inputs.mainTag, { required: true });
        const minorSegment = getInput(Inputs.minorSegment);
        const majorSegment = getInput(Inputs.majorSegment);
        const push = getInput(Inputs.push) === 'true';
        const release = await actions.makeRelease({
          releasePrefix,
          githubClient,
          rowMainTag: mainTag,
          rowMajorSegment: majorSegment,
          rowMinorSegment: minorSegment,
          push,
        });
        info(`new release tag ${release.newReleaseTag}`);
        info(`new release branch ${release.newReleaseBranch}`);
        info(`new main tag ${release.newMainTag}`);
        if (push) {
          info(`changes pushed to repository`);
        }
        setOutput('NEW_RELEASE', {
          newReleaseTag: release.newReleaseTag.value,
          newMainTag: release.newMainTag.value,
          newReleaseBranch: release.newReleaseBranch,
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
