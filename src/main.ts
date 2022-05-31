import { getActionAdapter } from './actions/actionAdapter';
import { runAction } from './actions/actionRunner';
import { getGithubAdapter } from './github/gihubAdapter';
import { GithubClient } from './github/GithubClient';
import { JiraClient } from './jira/JiraClient';
import { JiraUser } from './jira/types';
import { getServiceLocator } from './services/serviceLocator';

async function run() {
  const actionAdapter = getActionAdapter();
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken == null) {
      throw new Error('GITHUB_TOKEN is not provided');
    }

    await runAction({
      githubToken,
      actionAdapter,
      getJiraClient: (jiraUser: JiraUser, orgOrigin: string) =>
        new JiraClient(jiraUser, orgOrigin),
      getGithubClient: (token) => new GithubClient(getGithubAdapter(token)),
      getServiceLocator,
    });
  } catch (e) {
    if (e instanceof Error) {
      actionAdapter.setFailed(e);
    }
  }
}

run();
