import { Mocked } from '../../testUtils';
import { Inputs } from '../../types';
import { ActionAdapter } from '../actionAdapter';
import { runAction } from '../actionRunner';
import { mockedGithubClient, mockedServiceLocator } from './mocks';

const mockedActionAdapter: Mocked<ActionAdapter> = {
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  sha: 'abc',
};

describe('run action', () => {
  it('ensure action name is required', async () => {
    await runAction({
      githubClient: mockedGithubClient,
      actionAdapter: mockedActionAdapter,
      serviceLocator: mockedServiceLocator,
    });
    expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
      1,
      Inputs.actionName,
      { required: true },
    );
  });

  describe('sets failed', () => {
    it('when exception is thrown', async () => {
      mockedActionAdapter.getInput.mockImplementation((name) => {
        switch (name as Inputs) {
          case Inputs.actionName:
            return 'autoIncrementPatch';
          case Inputs.prefix:
            return 'master';
          case Inputs.push:
            return 'true';
          default:
            throw new Error('Input not found');
        }
      });

      mockedServiceLocator.autoIncrementPatch.mockImplementationOnce(() => {
        throw new Error('error');
      });
      await runAction({
        githubClient: mockedGithubClient,
        actionAdapter: mockedActionAdapter,
        serviceLocator: mockedServiceLocator,
      });
      expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
        new Error('error'),
      );
    });
    it('when action name is wrong', async () => {
      const wrongActionName = 'wrongActionName';
      mockedActionAdapter.getInput.mockReturnValueOnce(wrongActionName);
      await runAction({
        githubClient: mockedGithubClient,
        actionAdapter: mockedActionAdapter,
        serviceLocator: mockedServiceLocator,
      });
      expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
        new Error(`${wrongActionName} should be unreachable`),
      );
    });
  });
});
