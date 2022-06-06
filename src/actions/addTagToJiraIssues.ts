import { IGithubClient } from '../github/GithubClient';
import { AddTagToJiraIssuesBuilder } from '../services/addTagToJiraIssues';
import { GenerateChangelogBuilder } from '../services/generateChangelog';
import { Inputs } from '../types';
import { ActionAdapter } from './actionAdapter';
import { GetJiraClient } from './types';

export type AddTagToJiraIssuesParams = {
  githubClient: IGithubClient;
  getJiraClient: GetJiraClient;
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
  const jiraTagFieldName = getInput(Inputs.jiraTagFieldName, {
    required: true,
  });
  const jiraApiToken = getInput(Inputs.jiraApiToken, { required: true });
  const jiraOrgOrigin = getInput(Inputs.jiraOrgOrigin, { required: true });
  const jiraUserEmail = getInput(Inputs.jiraUserEmail, { required: true });
  const prefix = getInput(Inputs.prefix);
  const jiraClient = getJiraClient(
    {
      token: jiraApiToken,
      email: jiraUserEmail,
    },
    jiraOrgOrigin,
  );
  const generateChangelog = generateChangelogBuilder(githubClient, jiraClient);
  const addTagToJiraIssuesService = addTagToJiraIssuesBuilder(
    generateChangelog,
    jiraClient,
    actionAdapter.info,
  );
  const tag = getInput(Inputs.tag, { required: true });
  const result = await addTagToJiraIssuesService({
    rawTag: tag,
    tagFieldName: jiraTagFieldName,
    prefix,
  });
  const notUpdatedIssues = result.allIssues.filter(
    (key) => !result.updatedIssues.includes(key),
  );
  if (notUpdatedIssues.length !== 0) {
    info(`issues that were not updated: ${notUpdatedIssues.join(', ')}`);
  }
  info(`updated issues: ${result.updatedIssues.join(', ')}`);
}
