import { IGithubClient } from '../../github/GithubClient';
import { Tag } from '../../models/Tag';
import { Inputs } from '../../types';
import { Action, Actions } from '../action';
import { ActionAdapter } from '../actionAdapter';

describe('action', () => {
  describe('run', () => {
    const githubClient: IGithubClient = {
      createTag: jest.fn<Promise<void>, [Tag]>(),
      listSemVerTags: async () => Promise.resolve([new Tag('master-0.1.1')]),
      createBranch: jest.fn<Promise<void>, [string]>(),
    };

    const getActionAdapter: (
      getInput: ActionAdapter['getInput'],
    ) => ActionAdapter = (getInput) => ({
      getInput,
      info: jest.fn(),
      setFailed: jest.fn(),
      setOutput: jest.fn(),
      sha: 'abc',
    });
    const defaultActions: Actions = {
      autoIncrementPatch: jest.fn(),
      makePrerelease: jest.fn(),
    };
    describe('sets failed', () => {
      it('when exception is thrown', async () => {
        const actionAdapter = getActionAdapter(
          jest.fn((name) => {
            switch (name as Inputs) {
              case Inputs.actionName:
                return 'autoIncrementPatch';
              case Inputs.branch:
                return 'master';
              default:
                throw new Error('Input not found');
            }
          }),
        );

        const actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () => {
            throw new Error('error');
          }),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.setFailed).toHaveBeenCalledWith(
          new Error('error'),
        );
      });
      it('when action name is wrong', async () => {
        const wrongActionName = 'wrongActionName';
        const actionAdapter = getActionAdapter(jest.fn(() => wrongActionName));

        const actions = {
          autoIncrementPatch: jest.fn(),
          makePrerelease: jest.fn(),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.setFailed).toHaveBeenCalledWith(
          new Error(`${wrongActionName} is unknown`),
        );
      });
    });

    describe('runs autoIncrementPatch', () => {
      const branch = 'master';
      const actionAdapter = getActionAdapter(
        jest.fn((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'autoIncrementPatch';
            case Inputs.branch:
              return branch;
            default:
              throw new Error('Input not found');
          }
        }),
      );
      it('when action name is autoIncrementPatch', async () => {
        const actions: Actions = {
          autoIncrementPatch: jest.fn(async () =>
            Promise.resolve(new Tag('master-1.1.0')),
          ),
          makePrerelease: jest.fn(),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actions.autoIncrementPatch).toHaveBeenCalledWith(
          githubClient,
          branch,
        );
        expect(actions.makePrerelease).not.toBeCalled();
      });
      it('and sets output when tag is returned', async () => {
        const tag = new Tag('master-1.1.0');
        const actions: Actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () =>
            Promise.resolve(new Tag('master-1.1.0')),
          ),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
        expect(actionAdapter.info).toHaveBeenCalledWith(
          `pushed new tag ${tag.value}`,
        );
      });
      it('and informs when tag is not returned', async () => {
        const actions: Actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () => Promise.resolve(undefined)),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.info).toHaveBeenCalledWith(
          `can't make a new tag from ${branch}`,
        );
      });
    });

    describe('runs makePrerelease', () => {
      const tag = new Tag('master-1.1.0-abc');
      const branch = 'master';
      const actionAdapter = getActionAdapter(
        jest.fn((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'makePrerelease';
            case Inputs.branch:
              return branch;
            case Inputs.prefix:
              return branch;
            default:
              throw new Error('Input not found');
          }
        }),
      );
      it('when action name is makePrerelease', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actions.makePrerelease).toHaveBeenCalledWith(
          githubClient,
          'master',
          'abc',
        );
        expect(actions.autoIncrementPatch).not.toBeCalled();
      });
      it('and sets output when tag is returned', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
      });
    });
  });
});
