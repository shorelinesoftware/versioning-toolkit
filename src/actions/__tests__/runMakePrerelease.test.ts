import { Tag } from '../../models/Tag';
import { Inputs } from '../../types';
import { makePrerelease } from '../makePrerelease';
import {
  mockedActionAdapter,
  mockedServiceLocator,
  mockedGithubClient,
} from './mocks';

describe('runs makePrerelease', () => {
  const tag = new Tag('master-1.1.0-abc');
  const branch = 'master';
  beforeAll(() => {
    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'makePrerelease';
        case Inputs.prefix:
          return branch;
        case Inputs.push:
          return 'false';
        default:
          throw new Error('Input not found');
      }
    });
  });
  it('and sets output when tag is returned', async () => {
    mockedServiceLocator.makePrerelease.mockReturnValueOnce(
      Promise.resolve(tag),
    );

    await makePrerelease({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      makePrereleaseService: mockedServiceLocator.makePrerelease,
    });
    expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
      'NEW_TAG',
      tag.value,
    );
  });
  it('and informs about new tag', async () => {
    mockedServiceLocator.makePrerelease.mockReturnValueOnce(
      Promise.resolve(tag),
    );
    await makePrerelease({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      makePrereleaseService: mockedServiceLocator.makePrerelease,
    });
    expect(mockedActionAdapter.info).toHaveBeenCalledWith(`new tag: ${tag}`);
  });
  it('and informs if new tag was pushed', async () => {
    mockedServiceLocator.makePrerelease.mockReturnValueOnce(
      Promise.resolve(tag),
    );

    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'makePrerelease';
        case Inputs.push:
          return 'true';
        case Inputs.prefix:
          return branch;
        default:
          throw new Error('Input not found');
      }
    });

    await makePrerelease({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      makePrereleaseService: mockedServiceLocator.makePrerelease,
    });
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      2,
      `pushed new tag ${tag.value}`,
    );
  });
});
