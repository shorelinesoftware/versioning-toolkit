import { Tag } from '../../models/Tag';
import { Inputs } from '../../types';
import { runAction } from '../actionRunner';
import { assertGetInputIsCalled, assertSingleActionIsCalled } from './helpers';
import {
  mockedActionAdapter,
  mockedServiceLocator,
  mockedGithubClient,
} from './mocks';

describe('runs autoIncrementPatch', () => {
  beforeAll(() => {
    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'autoIncrementPatch';
        case Inputs.prefix:
          return prefix;
        case Inputs.push:
          return 'false';
        default:
          throw new Error('Input not found');
      }
    });
  });
  const prefix = 'master';

  it('when action name is autoIncrementPatch', async () => {
    mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
      Promise.resolve(new Tag('master-1.1.0')),
    );
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedServiceLocator.autoIncrementPatch).toHaveBeenCalledWith({
      githubClient: mockedGithubClient,
      prefix,
      pushTag: false,
      sha: mockedActionAdapter.sha,
    });
    assertGetInputIsCalled(Inputs.prefix, { required: true });
    assertGetInputIsCalled(Inputs.push);
    assertSingleActionIsCalled('autoIncrementPatch');
  });

  it('and sets output when tag is returned', async () => {
    const tag = new Tag('master-1.1.0');
    mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
      Promise.resolve(new Tag('master-1.1.0')),
    );
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
      'NEW_TAG',
      tag.value,
    );
  });
  it('and informs when tag is not returned', async () => {
    mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
      Promise.resolve(Promise.resolve(undefined)),
    );

    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedActionAdapter.info).toHaveBeenCalledWith(
      `can't make a new tag from ${prefix}`,
    );
  });
  it('and informs about new tag', async () => {
    const tag = new Tag('master-1.1.0');
    mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
      Promise.resolve(new Tag(tag)),
    );
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedActionAdapter.info).toHaveBeenCalledWith(`new tag: ${tag}`);
  });
  it('and informs if new tag was pushed', async () => {
    const tag = new Tag('master-1.1.0');

    mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
      Promise.resolve(new Tag(tag)),
    );
    mockedActionAdapter.getInput.mockImplementation((name) => {
      switch (name as Inputs) {
        case Inputs.actionName:
          return 'autoIncrementPatch';
        case Inputs.prefix:
          return prefix;
        case Inputs.push:
          return 'true';
        default:
          throw new Error('Input not found');
      }
    });

    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      2,
      `pushed new tag ${tag.value}`,
    );
  });
});
