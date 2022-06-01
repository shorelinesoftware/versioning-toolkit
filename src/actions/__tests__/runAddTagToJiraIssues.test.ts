import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { Inputs } from '../../types';
import { addTagToJiraIssues } from '../addTagToJiraIssues';
import { assertGetInputIsCalled } from './helpers';
import {
  mockedActionAdapter,
  mockedAddTagToJiraIssues,
  mockedGithubClient,
  mockedJiraClient,
  mockedServiceLocator,
} from './mocks';

describe('run addTagToJiraIssues', () => {
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

  it('and uses correct input values', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: [],
      updatedIssues: [],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: () => mockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });

    assertGetInputIsCalled(Inputs.jiraApiToken, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.tag, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.jiraUserEmail, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.jiraTagFieldName, {
      required: true,
    });
    assertGetInputIsCalled(Inputs.jiraOrgOrigin, {
      required: true,
    });
  });
  it('and outputs not updated issues', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: () => mockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedActionAdapter.info,
      'issues that were not updated: 3, 4',
    );
  });
  it('and outputs updated issues', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: () => mockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedActionAdapter.info,
      'updated issues: 1, 2',
    );
  });
  it('does not output not updated issues if all issues were updated', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2', '3', '4'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: () => mockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    expect(mockedActionAdapter.info).not.toHaveBeenCalledWith(
      'issues that were not updated: ',
    );
  });
});
