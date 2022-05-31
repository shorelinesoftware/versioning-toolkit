import {
  AddTagToJiraIssuesBuilder,
  addTagToJiraIssuesBuilder,
} from './addTagToJiraIssues';
import { AutoIncrementPatch, autoIncrementPatch } from './autoIncrementPatch';
import {
  GenerateChangelogBuilder,
  generateChangelogBuilder,
} from './generateChangelog';
import { MakePrerelease, makePrerelease } from './makePrerelease';
import { MakeRelease, makeRelease } from './makeRelease';

export type GetServiceLocator = typeof getServiceLocator;

export function getServiceLocator(): ServiceLocator {
  return {
    autoIncrementPatch,
    makePrerelease,
    makeRelease,
    generateChangelogBuilder,
    addTagToJiraIssuesBuilder,
  };
}

export type ServiceLocator = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
  makeRelease: MakeRelease;
  generateChangelogBuilder: GenerateChangelogBuilder;
  addTagToJiraIssuesBuilder: AddTagToJiraIssuesBuilder;
};
