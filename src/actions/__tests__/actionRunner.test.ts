import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { Inputs } from '../../types';
import { ActionAdapter } from '../actionAdapter';
import { runAction, Actions } from '../actionRunner';
import { MakeReleaseParams } from '../makeRelease';

const mockedActions: Mocked<Actions> = {
  autoIncrementPatch: jest.fn(),
  makePrerelease: jest.fn(),
  makeRelease: jest.fn(),
};

const mockedActionAdapter: Mocked<ActionAdapter> = {
  getInput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  sha: jest.mocked('abc'),
};

function assertSingleActionIsCalled(excludedActionName: keyof Actions) {
  // eslint-disable-next-line github/array-foreach
  Object.entries(mockedActions)
    .filter(([key]) => key !== excludedActionName)
    .forEach(([, value]) => expect(value).not.toHaveBeenCalled());
}

describe('actionRunner', () => {
  describe('run action', () => {
    const mockedGithubClient: IGithubClient = {
      createTag: jest.fn<Promise<void>, [Tag]>(),
      listSemVerTags: async () => Promise.resolve([new Tag('master-0.1.1')]),
      createBranch: jest.fn<Promise<void>, [string]>(),
      deleteBranch: jest.fn<Promise<boolean>, [string]>(),
      checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
      getTag: jest.fn<Promise<GithubTag>, [string]>(),
    };

    it('ensure action name is required', async () => {
      await runAction({
        githubClient: mockedGithubClient,
        actionAdapter: mockedActionAdapter,
        actions: mockedActions,
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

        mockedActions.autoIncrementPatch.mockImplementationOnce(() => {
          throw new Error('error');
        });
        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
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
          actions: mockedActions,
        });
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
            case Inputs.push:
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
        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
        });
        expect(mockedActions.autoIncrementPatch).toHaveBeenCalledWith({
          githubClient: mockedGithubClient,
          prefix,
          push: false,
          sha: mockedActionAdapter.sha,
        });
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          2,
          Inputs.prefix,
          { required: true },
        );
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          3,
          Inputs.push,
        );
        assertSingleActionIsCalled('autoIncrementPatch');
      });

      it('and sets output when tag is returned', async () => {
        const tag = new Tag('master-1.1.0');
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag('master-1.1.0')),
        );
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
      it('and informs when tag is not returned', async () => {
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(Promise.resolve(undefined)),
        );

        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
        });
        expect(mockedActionAdapter.info).toHaveBeenCalledWith(
          `can't make a new tag from ${prefix}`,
        );
      });
      it('and informs about new tag', async () => {
        const tag = new Tag('master-1.1.0');
        mockedActions.autoIncrementPatch.mockReturnValueOnce(
          Promise.resolve(new Tag(tag)),
        );
        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
        });
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
            case Inputs.push:
              return 'true';
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
          push: false,
        });
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          2,
          Inputs.prefix,
          { required: true },
        );
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          3,
          Inputs.push,
        );
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

    describe('runs makeRelease', () => {
      const mainTag = new Tag('master-1.0.0');
      const releasePrefix = 'stable';
      const majorSegment = '1';
      const minorSegment = '1';
      beforeAll(() => {
        mockedActionAdapter.getInput.mockImplementation((name) => {
          switch (name as Inputs) {
            case Inputs.actionName:
              return 'makeRelease';
            case Inputs.mainTag:
              return mainTag.value;
            case Inputs.releasePrefix:
              return releasePrefix;
            case Inputs.push:
              return '';
            case Inputs.majorSegment:
              return majorSegment;
            case Inputs.minorSegment:
              return minorSegment;
            default:
              throw new Error('Input not found');
          }
        });
      });
      const release = {
        newReleaseTag: new Tag('stable-1.0.0'),
        newMainTag: mainTag,
        newReleaseBranch: 'stable-1.0',
      };

      it('when action name is makeRelease', async () => {
        mockedActions.makeRelease.mockReturnValueOnce(Promise.resolve(release));
        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
        });

        const params: MakeReleaseParams = {
          githubClient: mockedGithubClient,
          rowMainTag: mainTag.value,
          releasePrefix,
          rowMajorSegment: majorSegment,
          rowMinorSegment: minorSegment,
        };

        expect(mockedActions.makeRelease).toHaveBeenCalledWith(params);
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          2,
          Inputs.releasePrefix,
          { required: true },
        );
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          3,
          Inputs.mainTag,
          { required: true },
        );
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          4,
          Inputs.minorSegment,
        );
        expect(mockedActionAdapter.getInput).toHaveBeenNthCalledWith(
          5,
          Inputs.majorSegment,
        );
        assertSingleActionIsCalled('makeRelease');
      });
      it('and infos about new release and outputs result', async () => {
        mockedActions.makeRelease.mockReturnValueOnce(Promise.resolve(release));
        await runAction({
          githubClient: mockedGithubClient,
          actionAdapter: mockedActionAdapter,
          actions: mockedActions,
        });
        expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
          1,
          `new release tag ${release.newReleaseTag}`,
        );
        expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
          2,
          `new release branch ${release.newReleaseBranch}`,
        );
        expect(mockedActionAdapter.info).toHaveBeenNthCalledWith(
          3,
          `new main tag ${release.newMainTag}`,
        );
        expect(mockedActionAdapter.setOutput).toHaveBeenCalledWith(
          'NEW_RELEASE',
          {
            newReleaseTag: release.newReleaseTag.value,
            newMainTag: release.newMainTag.value,
            newReleaseBranch: release.newReleaseBranch,
          },
        );
      });
    });
  });
});
