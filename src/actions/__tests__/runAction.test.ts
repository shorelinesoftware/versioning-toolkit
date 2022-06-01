import { Tag } from '../../models/Tag';
import { AddTagToJiraIssuesParams } from '../../services/addTagToJiraIssues';
import { MakeReleaseParams } from '../../services/makeRelease';
import { Inputs } from '../../types';
import { runAction } from '../actionRunner';
import { assertGetInputIsCalled } from './helpers';
import {
  mockedActionAdapter,
  mockedGithubClient,
  mockedJiraClient,
  mockedServiceLocator,
  mockedAddTagToJiraIssues,
} from './mocks';

async function executeAction() {
  await runAction({
    getGithubClient: () => mockedGithubClient,
    actionAdapter: mockedActionAdapter,
    getServiceLocator: () => mockedServiceLocator,
    githubToken: '',
    getJiraClient: () => mockedJiraClient,
  });
}

describe('run action', () => {
  it('ensure action name is required', async () => {
    await executeAction();
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
      await executeAction();
      expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
        new Error('error'),
      );
    });
    it('when action name is wrong', async () => {
      const wrongActionName = 'wrongActionName';
      mockedActionAdapter.getInput.mockReturnValueOnce(wrongActionName);
      await runAction({
        getGithubClient: () => mockedGithubClient,
        actionAdapter: mockedActionAdapter,
        getServiceLocator: () => mockedServiceLocator,
        githubToken: '',
        getJiraClient: () => mockedJiraClient,
      });
      expect(mockedActionAdapter.setFailed).toHaveBeenCalledWith(
        new Error(`${wrongActionName} should be unreachable`),
      );
    });
  });
  describe('runs when action name is', () => {
    it('autoIncrementPatch', async () => {
      const prefix = 'master';
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

      mockedServiceLocator.autoIncrementPatch.mockReturnValueOnce(
        Promise.resolve(new Tag('master-1.1.0')),
      );
      await executeAction();
      expect(mockedServiceLocator.autoIncrementPatch).toHaveBeenCalledWith({
        githubClient: mockedGithubClient,
        prefix,
        pushTag: false,
        sha: mockedActionAdapter.sha,
      });
      assertGetInputIsCalled(Inputs.prefix, { required: true });
      assertGetInputIsCalled(Inputs.push);
    });

    it('makePrerelease', async () => {
      const tag = new Tag('master-1.1.0-abc');
      mockedActionAdapter.getInput.mockImplementation((name) => {
        switch (name as Inputs) {
          case Inputs.actionName:
            return 'makePrerelease';
          case Inputs.prefix:
            return 'master';
          case Inputs.push:
            return 'false';
          default:
            throw new Error('Input not found');
        }
      });

      mockedServiceLocator.makePrerelease.mockReturnValueOnce(
        Promise.resolve(tag),
      );
      await executeAction();
      expect(mockedServiceLocator.makePrerelease).toHaveBeenCalledWith({
        githubClient: mockedGithubClient,
        tagPrefix: 'master',
        sha: 'abc',
        pushTag: false,
      });
      assertGetInputIsCalled(Inputs.prefix, { required: true });
      assertGetInputIsCalled(Inputs.push);
    });

    it('makeRelease', async () => {
      const mainTag = new Tag('master-1.0.0');
      const releasePrefix = 'stable';
      const majorSegment = '1';
      const minorSegment = '1';
      mockedActionAdapter.getInput.mockImplementation((name) => {
        switch (name as Inputs) {
          case Inputs.actionName:
            return 'makeRelease';
          case Inputs.tag:
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
      const release = {
        newReleaseTag: new Tag('stable-1.0.0'),
        newMainTag: mainTag,
        newReleaseBranch: 'stable-1.0',
      };
      mockedServiceLocator.makeRelease.mockReturnValueOnce(
        Promise.resolve(release),
      );
      await executeAction();
      const params: MakeReleaseParams = {
        githubClient: mockedGithubClient,
        rowMainTag: mainTag.value,
        releasePrefix,
        rowMajorSegment: majorSegment,
        rowMinorSegment: minorSegment,
        push: false,
      };

      expect(mockedServiceLocator.makeRelease).toHaveBeenCalledWith(params);
      assertGetInputIsCalled(Inputs.releasePrefix, {
        required: true,
      });
      assertGetInputIsCalled(Inputs.tag, {
        required: true,
      });
      assertGetInputIsCalled(Inputs.minorSegment);
      assertGetInputIsCalled(Inputs.majorSegment);
    });

    it('addTagToJiraIssues', async () => {
      const tag = 'master-1.0.0';
      const jiraTagFieldName = 'foo';
      const jiraUserEmail = 'foo@bar.com';
      const jiraApiToken = '123';
      const jiraOrgOrigin = 'foo.atlassian.net';
      mockedActionAdapter.getInput.mockImplementation((name) => {
        switch (name as Inputs) {
          case Inputs.actionName:
            return 'addTagToJiraIssues';
          case Inputs.jiraApiToken:
            return jiraApiToken;
          case Inputs.jiraUserEmail:
            return jiraUserEmail;
          case Inputs.jiraTagFieldName:
            return jiraTagFieldName;
          case Inputs.jiraOrgOrigin:
            return jiraOrgOrigin;
          case Inputs.tag:
            return tag;
          default:
            throw new Error('Input not found');
        }
      });
      await executeAction();
      const params: AddTagToJiraIssuesParams = {
        rawTag: tag,
        tagFieldName: jiraTagFieldName,
      };
      expect(mockedAddTagToJiraIssues).toHaveBeenCalledWith(params);
    });
  });
});
