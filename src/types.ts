export enum Inputs {
  actionName = 'actionName',
  prefix = 'prefix',
  push = 'push',
  majorSegment = 'majorSegment',
  minorSegment = 'minorSegment',
  releasePrefix = 'releasePrefix',
  tag = 'tag',
  jiraTagFieldName = 'jiraTagFieldName',
  jiraUserEmail = 'jiraUserEmail',
  jiraApiToken = 'jiraApiToken',
  jiraOrgOrigin = 'jiraOrgOrigin',
}

export type ActionTypes =
  | 'autoIncrementPatch'
  | 'makePrerelease'
  | 'makeRelease'
  | 'addTagToJiraIssues';

// from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type PaginationParams = {
  perPage: number;
  page: number;
};

export type ChangelogItem =
  | {
      issueKey: string;
      type: string;
      existsInJira: boolean;
      summary: string;
    }
  | {
      issueKey: undefined;
      type: 'unknown';
      existsInJira: false;
      summary: string;
    };
