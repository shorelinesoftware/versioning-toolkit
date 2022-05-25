import { AutoIncrementPatch, autoIncrementPatch } from './autoIncrementPatch';
import { MakePrerelease, makePrerelease } from './makePrerelease';
import { MakeRelease, makeRelease } from './makeRelease';

export const serviceLocator: ServiceLocator = {
  autoIncrementPatch,
  makePrerelease,
  makeRelease,
};

export type ServiceLocator = {
  autoIncrementPatch: AutoIncrementPatch;
  makePrerelease: MakePrerelease;
  makeRelease: MakeRelease;
};
