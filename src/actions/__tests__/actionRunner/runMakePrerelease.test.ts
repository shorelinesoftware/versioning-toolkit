import { Tag } from '../../../models/Tag';
import { Inputs } from '../../../types';
import { runAction } from '../../actionRunner';
import { assertGetInputIsCalled, assertSingleActionIsCalled } from './helpers';
import {
  mockedActionAdapter,
  mockedActions,
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

  it('when action name is makePrerelease', async () => {
    mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      actions: mockedActions,
    });
    expect(mockedActions.makePrerelease).toHaveBeenCalledWith({
      githubClient: mockedGithubClient,
      tagPrefix: 'master',
      sha: 'abc',
      pushTag: false,
    });
    assertGetInputIsCalled(Inputs.prefix, { required: true });
    assertGetInputIsCalled(Inputs.push);
    assertSingleActionIsCalled('makePrerelease');
  });
  it('and sets output when tag is returned', async () => {
    mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));

    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      actions: mockedActions,
    });
    expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
      'NEW_TAG',
      tag.value,
    );
  });
  it('and informs about new tag', async () => {
    mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      actions: mockedActions,
    });
    expect(mockedActionAdapter.info).toHaveBeenCalledWith(`new tag: ${tag}`);
  });
  it('and informs if new tag was pushed', async () => {
    mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));

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

    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      actions: mockedActions,
    });
    expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
      2,
      `pushed new tag ${tag.value}`,
    );
  });
});
