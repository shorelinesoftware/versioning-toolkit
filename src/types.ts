export enum Inputs {
  actionName = 'actionName',
  prefix = 'prefix',
  push = 'push',
  majorSegment = 'majorSegment',
  minorSegment = 'minorSegment',
  releasePrefix = 'releasePrefix',
  mainTag = 'mainTag',
}

export type ActionName =
  | 'autoIncrementPatch'
  | 'makePrerelease'
  | 'makeRelease';

// from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;
