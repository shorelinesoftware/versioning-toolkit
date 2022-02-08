export enum Inputs {
  actionName = 'actionName',
  prefix = 'prefix',
  pushTag = 'pushTag',
}

export type ActionName = 'autoIncrementPatch' | 'makePrerelease';

// from https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-421529650
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false;
