import { getActionAdapter } from './actions/actionAdapter';
import { runAction } from './actions/actionRunner';
import { getGithubAdapter } from './github/gihubAdapter';
import { GithubClient } from './github/GithubClient';
import { JiraClient } from './jira/JiraClient';
import { getServiceLocator } from './services/serviceLocator';

async function run() {
  const actionAdapter = getActionAdapter();
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken == null) {
      throw new Error('GITHUB_TOKEN is not provided');
    }
    const githubClient = new GithubClient(getGithubAdapter(githubToken));
    const serviceLocator = getServiceLocator(
      githubClient,
      new JiraClient(
        {
          email: '',
          token: '',
        },
        '',
      ),
    );
    await runAction({
      githubClient,
      actionAdapter,
      serviceLocator,
    });
  } catch (e) {
    if (e instanceof Error) {
      actionAdapter.setFailed(e);
    }
  }
}

run();
