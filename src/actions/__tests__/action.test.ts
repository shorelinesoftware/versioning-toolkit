import { IGithubClient } from '../../github/GithubClient';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { Inputs } from '../../types';
import { Action, Actions } from '../action';
import { ActionAdapter } from '../actionAdapter';

const mockedActions: Mocked<Actions> = {
  autoIncrementPatch: jest.fn(),
  makePrerelease: jest.fn(),
  createRelease: jest.fn(),
};

const mockedActionAdapter: Mocked<ActionAdapter> = {
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  sha: jest.mocked('abc'),
};

describe('action', () => {
  describe('run', () => {
    const mockedGithubClient: IGithubClient = {
      createTag: jest.fn<Promise<void>, [Tag]>(),
      listSemVerTags: async () => Promise.resolve([new Tag('master-0.1.1')]),
      createBranch: jest.fn<Promise<void>, [string]>(),
      deleteBranch: jest.fn<Promise<boolean>, [string]>(),
      checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    };
    describe('sets failed', () => {
      it('when exception is thrown', async () => {
        mockedActionAdapter.getInput.mockImplementation((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'autoIncrementPatch';
            case Inputs.prefix:
              return 'master';
            case Inputs.pushTag:
              return 'true';
            default:
              throw new Error('Input not found');
          }
        });

        mockedActions.autoIncrementPatch.mockImplementationOnce(() => {
          throw new Error('error');
        });
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
          new Error('error'),
        );
      });
      it('when action name is wrong', async () => {
        const wrongActionName = 'wrongActionName';
        mockedActionAdapter.getInput.mockReturnValueOnce(wrongActionName);

        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
          new Error(`${wrongActionName} should be unreachable`),
        );
      });
    });

    describe('runs autoIncrementPatch', () => {
      beforeAll(() => {
        mockedActionAdapter.getInput.mockImplementation((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'autoIncrementPatch';
            case Inputs.prefix:
              return prefix;
            case Inputs.pushTag:
              return 'false';
            default:
              throw new Error('Input not found');
          }
        });
      });
      const prefix = 'master';

      it('when action name is autoIncrementPatch', async () => {
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag('master-1.1.0')),
        );
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActions.autoIncrementPatch).toHaveBeenCalledWith({
          githubClient: mockedGithubClient,
          prefix,
          pushTag: false,
        });
        expect(mockedActions.makePrerelease).not.toBeCalled();
      });
      it('and sets output when tag is returned', async () => {
        const tag = new Tag('master-1.1.0');
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag('master-1.1.0')),
        );
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
      });
      it('and informs when tag is not returned', async () => {
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(Promise.resolve(undefined)),
        );

        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.info).toHaveBeenCalledWith(
          `can't make a new tag from ${prefix}`,
        );
      });
      it('and informs about new tag', async () => {
        const tag = new Tag('master-1.1.0');
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag(tag)),
        );
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.info).toHaveBeenCalledWith(
          `new tag: ${tag}`,
        );
      });
      it('and informs if new tag was pushed', async () => {
        const tag = new Tag('master-1.1.0');

        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag(tag)),
        );
        mockedActionAdapter.getInput.mockImplementation((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'autoIncrementPatch';
            case Inputs.prefix:
              return prefix;
            case Inputs.pushTag:
              return 'true';
            default:
              throw new Error('Input not found');
          }
        });

        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
          2,
          `pushed new tag ${tag.value}`,
        );
      });
    });

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
            case Inputs.pushTag:
              return 'false';
            default:
              throw new Error('Input not found');
          }
        });
      });

      it('when action name is makePrerelease', async () => {
        mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActions.makePrerelease).toHaveBeenCalledWith({
          githubClient: mockedGithubClient,
          tagPrefix: 'master',
          sha: 'abc',
          pushTag: false,
        });
        expect(mockedActions.autoIncrementPatch).not.toBeCalled();
      });
      it('and sets output when tag is returned', async () => {
        mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));

        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
      });
      it('and informs about new tag', async () => {
        mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));
        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.info).toHaveBeenCalledWith(
          `new tag: ${tag}`,
        );
      });
      it('and informs if new tag was pushed', async () => {
        mockedActions.makePrerelease.mockReturnValueOnce(Promise.resolve(tag));

        mockedActionAdapter.getInput.mockImplementation((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'makePrerelease';
            case Inputs.pushTag:
              return 'true';
            case Inputs.prefix:
              return branch;
            default:
              throw new Error('Input not found');
          }
        });

        const action = new Action(
          mockedGithubClient,
          mockedActionAdapter,
          mockedActions,
        );
        await action.run();
        expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
          2,
          `pushed new tag ${tag.value}`,
        );
      });
    });
  });
});
