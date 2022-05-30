import { IGithubClient } from '../github/GithubClient';
import { IJiraClient } from '../jira/types';
import {
  AddTagToJiraIssues,
  addTagToJiraIssuesBuilder,
} from './addTagToJiraIssue';
import { AutoIncrementPatch, autoIncrementPatch } from './autoIncrementPatch';
import {
  GenerateChangelog,
  generateChangelogBuilder,
} from './generateChangelog';
import { MakePrerelease, makePrerelease } from './makePrerelease';
import { MakeRelease, makeRelease } from './makeRelease';

export function getServiceLocator(
  githubClient: IGithubClient,
  jiraClient: IJiraClient,
): ServiceLocator {
  const generateChangelog = generateChangelogBuilder(githubClient, jiraClient);
  return {
    autoIncrementPatch,
    makePrerelease,
    makeRelease,
    generateChangelog,
    addTagToJiraIssues: addTagToJiraIssuesBuilder(
      generateChangelog,
      jiraClient,
    ),
  };
}

export type ServiceLocator = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
  makeRelease: MakeRelease;
  generateChangelog: GenerateChangelog;
  addTagToJiraIssues: AddTagToJiraIssues;
};
