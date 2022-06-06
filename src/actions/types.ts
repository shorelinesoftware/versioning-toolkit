import { IGithubClient } from '../github/GithubClient';
import { IJiraClient, JiraUser } from '../jira/types';

export type GetJiraClient = (
  jiraUser: JiraUser,
  orgOrigin: string,
) => IJiraClient;

export type GetGithubClient = (token: string) => IGithubClient;
