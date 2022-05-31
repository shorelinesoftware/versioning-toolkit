import { IGithubClient } from '../github/GithubClient';
import { MakeRelease } from '../services/makeRelease';
import { Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';

export type MakeReleaseParams = {
  githubClient: IGithubClient;
  actionAdapter: ActionAdapter;
  makeReleaseService: MakeRelease;
};

export async function makeRelease({
  actionAdapter,
  githubClient,
  makeReleaseService,
}: MakeReleaseParams) {
  const { getInput, info, setOutput } = actionAdapter;

  const releasePrefix = getInput(Inputs.releasePrefix, {
    required: true,
  });
  const mainTag = getInput(Inputs.tag, { required: true });
  const minorSegment = getInput(Inputs.minorSegment);
  const majorSegment = getInput(Inputs.majorSegment);
  const push = getInput(Inputs.push) === 'true';
  const release = await makeReleaseService({
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
  setOutput('NEW_RELEASE_TAG', release.newReleaseTag.value);
  setOutput('NEW_RELEASE_BRANCH', release.newReleaseBranch);
  setOutput('NEW_MAIN_TAG', release.newMainTag.value);
  return;
}
