import { getActionAdapter } from './actions/actionAdapter';
import { runAction, Actions } from './actions/actionRunner';
import { autoIncrementPatch } from './actions/autoIncrementPatch';
import { makePrerelease } from './actions/makePrerelease';
import { makeRelease } from './actions/makeRelease';
import { getGithubAdapter } from './github/gihubAdapter';
import { createGithubClient } from './github/GithubClient';

async function run() {
  const actionAdapter = getActionAdapter();
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken == null) {
      throw new Error('GITHUB_TOKEN is not provided');
    }
    const github = createGithubClient(getGithubAdapter(githubToken));

    const actionDictionary: Actions = {
      autoIncrementPatch,
      makePrerelease,
      createRelease: makeRelease,
    };

    await runAction({
      githubClient: github,
      actionAdapter,
      actions: actionDictionary,
    });
  } catch (e) {
    if (e instanceof Error) {
      actionAdapter.setFailed(e);
    }
  }
}

run();
