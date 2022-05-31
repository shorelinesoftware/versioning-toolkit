import { IGithubClient } from '../github/GithubClient';
import { IJiraClient, JiraUser } from '../jira/types';
import { GetServiceLocator } from '../services/serviceLocator';
import { ActionTypes, Inputs } from '../types';
import { assertUnreachable } from '../utils';
import { ActionAdapter } from './actionAdapter';
import { addTagToJiraIssues } from './addTagToJiraIssues';
import { autoIncrementPatch } from './autoIncrementPatch';
import { makePrerelease } from './makePrerelease';
import { makeRelease } from './makeRelease';

export type ActionRunnerParams = {
  githubToken: string;
  getServiceLocator: GetServiceLocator;
  actionAdapter: ActionAdapter;
  getJiraClient: (jiraUser: JiraUser, orgOrigin: string) => IJiraClient;
  getGithubClient: (token: string) => IGithubClient;
};

export async function runAction({
  githubToken,
  actionAdapter,
  getServiceLocator,
  getGithubClient,
  getJiraClient,
}: ActionRunnerParams) {
  const { setFailed, getInput } = actionAdapter;
  const githubClient = getGithubClient(githubToken);
  const serviceLocator = getServiceLocator();
  try {
    const actionName = getInput(Inputs.actionName, {
      required: true,
    }) as ActionTypes;
    switch (actionName) {
      case 'autoIncrementPatch': {
        return await autoIncrementPatch({
          githubClient,
          actionAdapter,
          autoIncrementPatchService: serviceLocator.autoIncrementPatch,
        });
      }
      case 'makePrerelease': {
        return await makePrerelease({
          githubClient,
          actionAdapter,
          makePrereleaseService: serviceLocator.makePrerelease,
        });
      }
      case 'makeRelease': {
        return await makeRelease({
          actionAdapter,
          githubClient,
          makeReleaseService: serviceLocator.makeRelease,
        });
      }
      case 'addTagToJiraIssues': {
        return await addTagToJiraIssues({
          actionAdapter,
          generateChangelogBuilder: serviceLocator.generateChangelogBuilder,
          addTagToJiraIssuesBuilder: serviceLocator.addTagToJiraIssuesBuilder,
          getJiraClient,
          githubClient,
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
