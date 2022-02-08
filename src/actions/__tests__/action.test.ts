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
              case Inputs.prefix:
                return 'master';
              case Inputs.pushTag:
                return 'true';
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
          new Error(`${wrongActionName} should be unreachable`),
        );
      });
    });

    describe('runs autoIncrementPatch', () => {
      const prefix = 'master';
      const defaultActionAdapter = getActionAdapter(
        jest.fn((name) => {
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
        }),
      );
      it('when action name is autoIncrementPatch', async () => {
        const actions: Actions = {
          autoIncrementPatch: jest.fn(async () =>
            Promise.resolve(new Tag('master-1.1.0')),
          ),
          makePrerelease: jest.fn(),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(actions.autoIncrementPatch).toHaveBeenCalledWith({
          githubClient,
          prefix,
          pushTag: false,
        });
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

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(defaultActionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
      });
      it('and informs when tag is not returned', async () => {
        const actions: Actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () => Promise.resolve(undefined)),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(defaultActionAdapter.info).toHaveBeenCalledWith(
          `can't make a new tag from ${prefix}`,
        );
      });
      it('and informs about new tag', async () => {
        const tag = new Tag('master-1.1.0');
        const actions: Actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(defaultActionAdapter.info).toHaveBeenCalledWith(
          `new tag: ${tag}`,
        );
      });
      it('and informs if new tag was pushed', async () => {
        const tag = new Tag('master-1.1.0');
        const actions: Actions = {
          ...defaultActions,
          autoIncrementPatch: jest.fn(async () => Promise.resolve(tag)),
        };

        const actionAdapter = getActionAdapter(
          jest.fn((name) => {
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
          }),
        );

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.info).toHaveBeenNthCalledWith(
          2,
          `pushed new tag ${tag.value}`,
        );
      });
    });

    describe('runs makePrerelease', () => {
      const tag = new Tag('master-1.1.0-abc');
      const branch = 'master';
      const defaultActionAdapter = getActionAdapter(
        jest.fn((name) => {
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
        }),
      );
      it('when action name is makePrerelease', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(actions.makePrerelease).toHaveBeenCalledWith({
          githubClient,
          tagPrefix: 'master',
          sha: 'abc',
          pushTag: false,
        });
        expect(actions.autoIncrementPatch).not.toBeCalled();
      });
      it('and sets output when tag is returned', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(defaultActionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_TAG',
          tag.value,
        );
      });
      it('and informs about new tag', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const action = new Action(githubClient, defaultActionAdapter, actions);
        await action.run();
        expect(defaultActionAdapter.info).toHaveBeenCalledWith(
          `new tag: ${tag}`,
        );
      });
      it('and informs if new tag was pushed', async () => {
        const actions: Actions = {
          ...defaultActions,
          makePrerelease: jest.fn(async () => Promise.resolve(tag)),
        };

        const actionAdapter = getActionAdapter(
          jest.fn((name) => {
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
          }),
        );

        const action = new Action(githubClient, actionAdapter, actions);
        await action.run();
        expect(actionAdapter.info).toHaveBeenNthCalledWith(
          2,
          `pushed new tag ${tag.value}`,
        );
      });
    });
  });
});
