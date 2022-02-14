export enum Inputs {
  actionName = 'actionName',
  prefix = 'prefix',
  pushTag = 'pushTag',
  majorSegment = 'majorSegment',
  minorSegment = 'minorSegment',
  releaseBranchNamePrefix = 'releaseBranchNamePrefix',
}

export type ActionName =
  | 'autoIncrementPatch'
  | 'makePrerelease'
  | 'createRelease';

// from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;
