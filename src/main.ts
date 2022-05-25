import { getActionAdapter } from './actions/actionAdapter';
import { runAction, Actions } from './actions/actionRunner';
import { getGithubAdapter } from './github/gihubAdapter';
import { GithubClient } from './github/GithubClient';
import { autoIncrementPatch } from './services/autoIncrementPatch';
import { makePrerelease } from './services/makePrerelease';
import { makeRelease } from './services/makeRelease';

async function run() {
  const actionAdapter = getActionAdapter();
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken == null) {
      throw new Error('GITHUB_TOKEN is not provided');
    }
    const githubClient = new GithubClient(getGithubAdapter(githubToken));

    const actionDictionary: Actions = {
      autoIncrementPatch,
      makePrerelease,
      makeRelease,
    };

    await runAction({
      githubClient,
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
