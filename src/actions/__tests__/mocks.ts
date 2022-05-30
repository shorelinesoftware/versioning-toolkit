import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import { ServiceLocator } from '../../services/serviceLocator';
import { Mocked } from '../../testUtils';
import { ActionAdapter } from '../actionAdapter';

export const mockedGithubClient: IGithubClient = {
  createTag: jest.fn<Promise<void>, [Tag]>(),
  listSemVerTags: async () => Promise.resolve([new Tag('master-0.1.1')]),
  createBranch: jest.fn<Promise<void>, [string]>(),
  deleteBranch: jest.fn<Promise<boolean>, [string]>(),
  checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
  getTag: jest.fn<Promise<GithubTag>, [string]>(),
  compareTags: jest.fn(async () => Promise.resolve([])),
};

export const mockedServiceLocator: Mocked<ServiceLocator> = {
  autoIncrementPatch: jest.fn(),
  makePrerelease: jest.fn(),
  makeRelease: jest.fn(),
  addTagToJiraIssues: jest.fn(),
  generateChangelog: jest.fn(),
};

export const mockedActionAdapter: Mocked<ActionAdapter> = {
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  sha: 'abc',
};
