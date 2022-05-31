import { IGithubClient } from '../github/GithubClient';
import { IJiraClient, JiraUser } from '../jira/types';
import { AddTagToJiraIssuesBuilder } from '../services/addTagToJiraIssues';
import { GenerateChangelogBuilder } from '../services/generateChangelog';
import { Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';

export type AddTagToJiraIssuesParams = {
  githubClient: IGithubClient;
  getJiraClient: (jiraUser: JiraUser, orgOrigin: string) => IJiraClient;
  actionAdapter: ActionAdapter;
  generateChangelogBuilder: GenerateChangelogBuilder;
  addTagToJiraIssuesBuilder: AddTagToJiraIssuesBuilder;
};

export async function addTagToJiraIssues({
  actionAdapter,
  getJiraClient,
  githubClient,
  generateChangelogBuilder,
  addTagToJiraIssuesBuilder,
}: AddTagToJiraIssuesParams) {
  const { getInput, info } = actionAdapter;
  const jiraClient = getJiraClient(
    {
      token: '',
      email: '',
    },
    '',
  );
  const generateChangelog = generateChangelogBuilder(githubClient, jiraClient);
  const addTagToJiraIssuesService = addTagToJiraIssuesBuilder(
    generateChangelog,
    jiraClient,
    actionAdapter.info,
  );
  const tag = getInput(Inputs.tag, { required: true });
  const tagFieldName = getInput(Inputs.jiraTagFieldName, { required: true });
  const result = await addTagToJiraIssuesService({
    rawTag: tag,
    tagFieldName,
  });
  const notUpdatedIssues = result.allIssues.filter(
    (key) => !result.updatedIssues.includes(key),
  );
  if (notUpdatedIssues.length !== 0) {
    info(`issues that were not updated: ${notUpdatedIssues.join(',')}`);
  }
  info(`updated issues: ${result.updatedIssues.join(',')}`);
}
