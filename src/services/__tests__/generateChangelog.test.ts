import { IGithubClient } from '../../github/GithubClient';
import { GithubTag } from '../../github/types';
import {
  CustomField,
  IJiraClient,
  Issue,
  IssueFieldUpdates,
} from '../../jira/types';
import { Tag } from '../../models/Tag';
import { Mocked } from '../../testUtils';
import { ChangelogItem } from '../../types';
import {
  generateChangelogBuilder,
  JIRA_KEY_REGEXP,
} from '../generateChangelog';

function changelogSortingPredicate(a: ChangelogItem, b: ChangelogItem) {
  return a.summary.localeCompare(b.summary);
}

describe('test JIRA_KEY_REGEXP', () => {
  it.each([
    {
      testCase: 'FOO-1',
      expected: ['FOO-1'],
    },
    {
      testCase: 'FOO-1FOO-2',
      expected: ['FOO-1', 'FOO-2'],
    },
    {
      testCase: 'FOO-1-FOO-2',
      expected: ['FOO-1', 'FOO-2'],
    },
    {
      testCase: 'FOO-1-abcFOO-2',
      expected: ['FOO-1'],
    },
    {
      testCase: 'abcFoo-1',
      expected: null,
    },
    {
      testCase: 'foo-1',
      expected: null,
    },
    {
      testCase: 'Foo-1',
      expected: null,
    },
    {
      testCase: 'something\n\rFOO-1',
      expected: ['FOO-1'],
    },
    {
      testCase: 'FOO1',
      expected: null,
    },
    {
      testCase: 'XY-FOO1',
      expected: null,
    },
    {
      testCase: 'FOO-001',
      expected: null,
    },
    {
      testCase: '',
      expected: null,
    },
    {
      testCase: `FOO-1avbc-FOO-1
JIRA-1 BIN-10000FOO-1 A-1 TACO-7133abc X-88 BF-18 ABC-1 BINGO-1 BUG-123
test AFSDF:
JIRA-01 BIN-10000000 abc-123 ABCDEFGHIJKL-999 abc XY-Z-333 abcDEF-33
VALID no \\s Ending
JIRA-1`,
      expected: [
        'FOO-1',
        'JIRA-1',
        'BIN-10000',
        'FOO-1',
        'A-1',
        'TACO-7133',
        'X-88',
        'BF-18',
        'ABC-1',
        'BINGO-1',
        'BUG-123',
        'BIN-10000000',
        'ABCDEFGHIJKL-999',
        'JIRA-1',
      ],
    },
  ])('parses $testCase into $expected', ({ testCase, expected }) => {
    expect(testCase.match(JIRA_KEY_REGEXP)).toEqual(expected);
  });
});

describe('generateChangelog', () => {
  const headTag = new Tag('main-1.0.2');
  const baseTag = new Tag('main-1.0.1');
  const jiraKeys = ['FOO-1', 'FOO-2', 'FOO-3', 'FOO-4', 'FOO-5', 'FOO-6'];
  const notMatchableJiraKeys = ['foo-5', 'abcFoo-5', 'abcFOO-5'];
  const commits = [
    {
      message: `${jiraKeys[0]} foo`,
      sha: '1',
    },
    {
      message: `${jiraKeys[0]} ${jiraKeys[1]} ${jiraKeys[0]}\n\r something\n\r${jiraKeys[2]}`,
      sha: '2',
    },
    {
      message: `${jiraKeys[3]}abc`,
      sha: '3',
    },
    {
      message: `${jiraKeys[4]}${jiraKeys[5]}`,
      sha: '4',
    },
    {
      message: 'unknown',
      sha: '5',
    },
    {
      message: notMatchableJiraKeys[0],
      sha: '6',
    },
    {
      message: notMatchableJiraKeys[1],
      sha: '7',
    },
    {
      message: notMatchableJiraKeys[2],
      sha: '6',
    },
  ];

  const mockedGithubClient: Mocked<IGithubClient> = {
    createTag: jest.fn<Promise<void>, [Tag, string]>(),
    listSemVerTags: jest.fn(async () =>
      Promise.resolve([new Tag('main-1.0.1'), new Tag('main-1.0.2')]),
    ),
    createBranch: jest.fn<Promise<void>, [string, string]>(),
    deleteBranch: jest.fn<Promise<boolean>, [string]>(),
    checkBranchExists: jest.fn<Promise<boolean>, [string]>(),
    getTag: jest.fn<Promise<GithubTag>, [string]>(),
    compareTags: jest.fn(async (_baseTag, _headTag) =>
      Promise.resolve(commits),
    ),
  };
  const issuetype = 'bug';

  function makeJiraIssue(key: string, index: number) {
    return {
      id: index,
      key,
      fields: {
        issuetype: {
          id: index,
          name: issuetype,
        },
        summary: `${key}-${index}`,
      },
    };
  }

  const mockedJiraClient: Mocked<IJiraClient> = {
    getIssuesByKeys: jest.fn(async (_keys) =>
      Promise.resolve<Issue[]>(jiraKeys.map(makeJiraIssue)),
    ),
    getCustomFields: jest.fn<Promise<CustomField[]>, []>(),
    updateIssue: jest.fn<Promise<void>, [IssueFieldUpdates, string]>(),
  };
  const info = jest.fn();
  const generateChangelog = generateChangelogBuilder(
    mockedGithubClient,
    mockedJiraClient,
    info,
  );
  it('generates changelog without duplicated issues', async () => {
    const expectedChangeLog: ChangelogItem[] = [
      ...jiraKeys.map((key, index) => {
        return {
          summary: `${key}-${index}`,
          issueKey: key,
          existsInJira: true,
          type: issuetype,
        };
      }),
      ...notMatchableJiraKeys.map((key) => {
        return {
          existsInJira: false as const,
          issueKey: undefined,
          summary: key,
          type: 'unknown' as const,
        };
      }),
      {
        existsInJira: false as const,
        issueKey: undefined,
        summary: 'unknown',
        type: 'unknown' as const,
      },
    ];
    const changelog = await generateChangelog({
      rawHeadTag: headTag.value,
    });
    expect(mockedGithubClient.compareTags).toHaveBeenCalledWith(
      baseTag,
      headTag,
    );
    expect(mockedJiraClient.getIssuesByKeys).toHaveBeenCalledWith(jiraKeys);
    expect(expectedChangeLog.sort(changelogSortingPredicate)).toEqual(
      changelog.sort(changelogSortingPredicate),
    );
  });
  describe('filters out changelog items if its Jira key exists in the previous changelog', () => {
    const jiraIssue = makeJiraIssue(jiraKeys[1], 1);
    const expectedChangeLog: ChangelogItem[] = [
      {
        summary: jiraIssue.fields.summary,
        type: jiraIssue.fields.issuetype.name,
        issueKey: jiraIssue.key,
        existsInJira: true,
      },
    ];
    it('when previous tag is default', async () => {
      mockedGithubClient.compareTags.mockImplementation(
        async (_baseTag, _headTag) => {
          if (_baseTag.value === 'main-1.0.0') {
            return Promise.resolve([
              {
                message: `${jiraKeys[0]}`,
                sha: '0',
              },
            ]);
          }
          return Promise.resolve([
            {
              message: `${jiraKeys[0]}`,
              sha: '1',
            },
            {
              message: `${jiraKeys[1]}`,
              sha: '2',
            },
          ]);
        },
      );
      mockedGithubClient.listSemVerTags.mockResolvedValueOnce([
        new Tag('main-1.0.0'),
        new Tag('main-1.0.1'),
        new Tag('main-2.0.2'),
      ]);

      const changelog = await generateChangelog({
        rawHeadTag: new Tag('main-2.0.2').value,
      });
      expect(expectedChangeLog.sort(changelogSortingPredicate)).toEqual(
        changelog.sort(changelogSortingPredicate),
      );
    });
    it('when previous tag is default with incremented patch segment', async () => {
      mockedGithubClient.compareTags.mockImplementation(
        async (_baseTag, _headTag) => {
          if (_baseTag.value === 'main-1.0.0') {
            return Promise.resolve([]);
          }
          if (_baseTag.value === 'main-1.0.1') {
            return Promise.resolve([
              {
                message: `${jiraKeys[0]}`,
                sha: '0',
              },
            ]);
          }
          return Promise.resolve([
            {
              message: `${jiraKeys[0]}`,
              sha: '1',
            },
            {
              message: `${jiraKeys[1]}`,
              sha: '2',
            },
          ]);
        },
      );
      mockedGithubClient.listSemVerTags.mockResolvedValueOnce([
        new Tag('main-1.0.1'),
        new Tag('main-1.0.2'),
        new Tag('main-2.0.2'),
      ]);
      const changelog = await generateChangelog({
        rawHeadTag: new Tag('main-2.0.2').value,
      });
      expect(expectedChangeLog.sort(changelogSortingPredicate)).toEqual(
        changelog.sort(changelogSortingPredicate),
      );
    });
  });

  it('sets existsInJira false for each changelog item if key does not exist in JIRA', async () => {
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(Promise.resolve([]));
    const commit1 = {
      message: 'BAR-1',
      sha: '1',
    };
    const commit2 = {
      message: 'test2',
      sha: '1',
    };
    mockedGithubClient.compareTags.mockReturnValueOnce(
      Promise.resolve([commit1, commit2]),
    );
    const changelog = await generateChangelog({
      rawHeadTag: headTag.value,
    });
    const expectedChangeLog: ChangelogItem[] = [
      {
        existsInJira: false,
        issueKey: 'BAR-1',
        summary: commit1.message,
        type: 'unknown',
      },
      {
        existsInJira: false,
        issueKey: undefined,
        summary: commit2.message,
        type: 'unknown',
      },
    ];
    expect(expectedChangeLog.sort(changelogSortingPredicate)).toEqual(
      changelog.sort(changelogSortingPredicate),
    );
    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenLastCalledWith(
      `${expectedChangeLog[0].issueKey} does not exist in Jira or user has no access to it`,
    );
  });
  it('sets existsInJira true and type for each changelog item if key exists in JIRA', async () => {
    const issue1 = {
      id: 1,
      key: 'FOO-1',
      fields: {
        issuetype: {
          id: 1,
          name: issuetype,
        },
        summary: 'sum1',
      },
    };
    const issue2 = {
      id: 2,
      key: 'FOO-2',
      fields: {
        issuetype: {
          id: 2,
          name: issuetype,
        },
        summary: 'sum2',
      },
    };
    mockedJiraClient.getIssuesByKeys.mockReturnValueOnce(
      Promise.resolve([issue1, issue2]),
    );
    const commit1 = {
      message: issue1.key,
      sha: '1',
    };
    const commit2 = {
      message: issue2.key,
      sha: '1',
    };
    mockedGithubClient.compareTags.mockReturnValueOnce(
      Promise.resolve([commit1, commit2]),
    );
    const changelog = await generateChangelog({
      rawHeadTag: headTag.value,
    });
    const expectedChangeLog: ChangelogItem[] = [
      {
        existsInJira: true,
        issueKey: issue1.key,
        summary: issue1.fields.summary,
        type: issuetype,
      },
      {
        existsInJira: true,
        issueKey: issue2.key,
        summary: issue2.fields.summary,
        type: issuetype,
      },
    ];
    expect(expectedChangeLog.sort(changelogSortingPredicate)).toEqual(
      changelog.sort(changelogSortingPredicate),
    );
  });
  it('returns empty changelog if base tag can not be found', async () => {
    const changelog = await generateChangelog({
      rawHeadTag: 'foo-0.0.1',
    });
    expect(changelog).toEqual([]);
  });
  it('throws error if tag can not be parsed', async () => {
    await expect(async () =>
      generateChangelog({
        rawHeadTag: '123',
      }),
    ).rejects.toThrow();
  });
});
