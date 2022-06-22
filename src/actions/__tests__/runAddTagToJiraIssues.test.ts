import { AddTagToJiraIssuesParams } from '../../services/addTagToJiraIssues';
import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { Inputs } from '../../types';
import { addTagToJiraIssues } from '../addTagToJiraIssues';
import { GetJiraClient } from '../types';
import { assertGetInputIsCalled } from './helpers';
import {
  getMockedJiraClient,
  mockedActionAdapter,
  mockedAddTagToJiraIssues,
  mockedGithubClient,
  mockedServiceLocator,
} from './mocks';

describe('run addTagToJiraIssues', () => {
  const tag = 'master-1.0.0';
  const jiraTagFieldName = 'foo';
  const jiraUserEmail = 'foo@bar.com';
  const jiraApiToken = '123';
  const jiraOrgOrigin = 'foo.atlassian.net';
  const jiraAdditionalTag = 'tag';
  const prefix = 'bar';
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
      case Inputs.prefix:
        return prefix;
      case Inputs.jiraAdditionalTag:
        return jiraAdditionalTag;
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
      getJiraClient: getMockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    expect(mockedAddTagToJiraIssues).toHaveBeenCalledWith<
      [AddTagToJiraIssuesParams]
    >({
      rawTag: tag,
      tagFieldName: jiraTagFieldName,
      prefix,
      additionalTag: jiraAdditionalTag,
    });
    expect(getMockedJiraClient).toHaveBeenCalledWith<Parameters<GetJiraClient>>(
      {
        email: jiraUserEmail,
        token: jiraApiToken,
      },
      jiraOrgOrigin,
    );
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
    assertGetInputIsCalled(Inputs.prefix);
  });
  it('and outputs all issues', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: getMockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedActionAdapter.info,
      'all issues: 1, 2, 3, 4',
    );
  });
  it('and outputs not updated issues', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: getMockedJiraClient,
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
      getJiraClient: getMockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    AssertToHaveBeenAnyNthCalledWithParams(
      mockedActionAdapter.info,
      'updated issues: 1, 2',
    );
  });
  it('does not output empty list of not updated issues if all issues were updated', async () => {
    mockedAddTagToJiraIssues.mockResolvedValueOnce({
      allIssues: ['1', '2', '3', '4'],
      updatedIssues: ['1', '2', '3', '4'],
    });
    await addTagToJiraIssues({
      actionAdapter: mockedActionAdapter,
      githubClient: mockedGithubClient,
      getJiraClient: getMockedJiraClient,
      addTagToJiraIssuesBuilder: mockedServiceLocator.addTagToJiraIssuesBuilder,
      generateChangelogBuilder: mockedServiceLocator.generateChangelogBuilder,
    });
    expect(mockedActionAdapter.info).not.toHaveBeenCalledWith(
      'issues that were not updated: ',
    );
  });
});
