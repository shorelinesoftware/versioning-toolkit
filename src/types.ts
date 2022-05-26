export enum Inputs {
  actionName = 'actionName',
  prefix = 'prefix',
  push = 'push',
  majorSegment = 'majorSegment',
  minorSegment = 'minorSegment',
  releasePrefix = 'releasePrefix',
  mainTag = 'mainTag',
}

export type ActionTypes =
  | 'autoIncrementPatch'
  | 'makePrerelease'
  | 'makeRelease';

// from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type JiraUser = {
  email: string;
  token: string;
};

export type ChangelogItem = {
  issueKey: string | undefined;
  existsInJira: boolean;
  summary: string;
};
