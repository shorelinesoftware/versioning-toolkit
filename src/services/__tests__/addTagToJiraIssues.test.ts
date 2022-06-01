import {
  CustomField,
  IJiraClient,
  Issue,
  IssueFieldUpdates,
} from '../../jira/types';
import { Mocked } from '../../testUtils';
import { ChangelogItem } from '../../types';
import { addTagToJiraIssuesBuilder } from '../addTagToJiraIssues';
import { GenerateChangelog } from '../generateChangelog';

describe('addTagToJiraIssues', () => {
  const tag = 'main-1.0.0';
  const branch = 'main-1.0';
  const customField: CustomField = {
    id: '1',
    name: 'tag',
  };
  const tagFieldName = customField.name;
  const tags = ['tag1', 'tag2'];
  const issue1: Issue = {
    id: 1,
    key: 'FOO-1',
    fields: {
      issuetype: {
        id: 1,
        name: '1',
      },
      summary: '1',
      [customField.id]: tags,
    },
  };
  const issue2: Issue = {
    id: 2,
    key: 'FOO-2',
    fields: {
      issuetype: {
        id: 2,
        name: '2',
      },
      summary: '2',
      [customField.id]: tags,
    },
  };
  const changelog1: ChangelogItem = {
    existsInJira: true,
    issueKey: issue1.key,
    summary: issue1.fields.summary,
    type: '1',
  };
  const changelog2: ChangelogItem = {
    existsInJira: true,
    issueKey: issue2.key,
    summary: issue2.fields.summary,
    type: '2',
  };
  const changelog3: ChangelogItem = {
    existsInJira: false,
    issueKey: undefined,
    summary: '123',
    type: 'unknown',
  };

  const mockedJiraClient: Mocked<IJiraClient> = {
    getIssuesByKeys: jest.fn(async (_keys) =>
      Promise.resolve<Issue[]>([issue1, issue2]),
    ),
    getCustomFields: jest.fn<Promise<CustomField[]>, []>(async () =>
      Promise.resolve([customField]),
    ),
    updateIssue: jest.fn<Promise<void>, [IssueFieldUpdates, string]>(async () =>
      Promise.resolve(),
    ),
  };

  const generateChangelog: GenerateChangelog = async () =>
    Promise.resolve([changelog1, changelog2, changelog3]);
  const info = jest.fn();
  const addTagToJiraIssues = addTagToJiraIssuesBuilder(
    generateChangelog,
    mockedJiraClient,
    info,
  );
  it('adds tag to all existed issues', async () => {
    const expectedResult = {
      updatedIssues: [issue1.key, issue2.key],
      allIssues: [issue1.key, issue2.key],
    };
    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual(expectedResult);
  });

  it('sends request to get issues only for existed issues', async () => {
    await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(mockedJiraClient.getIssuesByKeys).toHaveBeenCalledWith([
      issue1.key,
      issue2.key,
    ]);
  });
  it('skips issue if tag field is not array', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(
      Promise.resolve([
        issue1,
        {
          ...issue2,
          fields: {
            issuetype: {
              id: 2,
              name: '2',
            },
            summary: '2',
            [customField.id]: 'foo',
          },
        },
      ]),
    );
    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [issue1.key],
      allIssues: [issue1.key, issue2.key],
    });
  });
  it('adds tag field if issue does not have it', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(
      Promise.resolve([
        issue1,
        {
          ...issue2,
          fields: {
            issuetype: {
              id: 2,
              name: '2',
            },
            summary: '2',
          },
        },
      ]),
    );
    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [issue1.key, issue2.key],
      allIssues: [issue1.key, issue2.key],
    });
  });

  it('appends tag and branch to existed tags when updates issue', async () => {
    const expectErrors: unknown[] = [];
    mockedJiraClient.updateIssue.mockImplementationOnce(async (updates) => {
      try {
        expect(updates.fields[customField.id]).toEqual([...tags, tag, branch]);
      } catch (e) {
        expectErrors.push(e);
      }
      return Promise.resolve();
    });
    await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    for (const expectError of expectErrors) {
      throw expectError;
    }
  });
  it('removes duplicates from tag field when updates issue', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(
      Promise.resolve([
        {
          id: 1,
          key: '1',
          fields: {
            issuetype: {
              id: 2,
              name: '2',
            },
            summary: '2',
            [customField.id]: [tag],
          },
        },
      ]),
    );
    const expectErrors: unknown[] = [];
    mockedJiraClient.updateIssue.mockImplementationOnce(async (updates) => {
      try {
        expect(updates.fields[customField.id]).toEqual([tag, branch]);
      } catch (e) {
        expectErrors.push(e);
      }
      return Promise.resolve();
    });
    await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    for (const expectError of expectErrors) {
      throw expectError;
    }
  });
  it('returns empty array if tagField can not be found', async () => {
    mockedJiraClient.getCustomFields.mockReturnValueOnce(Promise.resolve([]));
    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [],
      allIssues: [issue1.key, issue2.key],
    });
  });
  it('returns empty array if no issues are updated', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(Promise.resolve([]));

    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [],
      allIssues: [],
    });
  });
  it('returns not empty array if some issues are updated', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(
      Promise.resolve([issue1]),
    );

    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [issue1.key],
      allIssues: [issue1.key],
    });
  });
  it('does not throw exception if and infos if issue can not be updated', async () => {
    mockedJiraClient.updateIssue.mockRejectedValueOnce(new Error());

    const result = await addTagToJiraIssues({
      tagFieldName,
      rawTag: tag,
    });
    expect(result).toEqual({
      updatedIssues: [issue2.key],
      allIssues: [issue1.key, issue2.key],
    });
    expect(info).toHaveBeenCalledTimes(1);
  });
  it('throws exception if raw tag can not be parsed', async () => {
    await expect(async () =>
      addTagToJiraIssues({
        tagFieldName,
        rawTag: '123',
      }),
    ).rejects.toThrow();
  });
});
