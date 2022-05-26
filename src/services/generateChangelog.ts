import { IGithubClient } from '../github/GithubClient';
import { IJiraClient } from '../jira/types';
import { Tag } from '../models/Tag';
import { ChangelogItem } from '../types';
import { unique } from '../utils';

export const JIRA_KEY_REGEXP = /((?<!([A-Za-z]{1,10})-?)[A-Z]+-[1-9]\d*)/g;

export type GenerateChangelogParams = {
  githubClient: IGithubClient;
  jiraClient: IJiraClient;
  rawHeadTag: string;
};

export type GenerateChangelog = typeof generateChangelog;

export async function generateChangelog({
  githubClient,
  rawHeadTag,
  jiraClient,
}: GenerateChangelogParams) {
  const headTag = new Tag(rawHeadTag);
  const tags = await githubClient.listSemVerTags(true);
  const baseTag = Tag.getPreviousTag(tags, headTag);
  const commits = await githubClient.compareTags(baseTag, headTag);
  const changeLog: ChangelogItem[] = commits
    .map((commit) => {
      const keys = unique(commit.message.match(JIRA_KEY_REGEXP) ?? []);
      if (keys.length === 0) {
        return {
          summary: commit.message,
          issueKey: undefined,
          existsInJira: false,
        };
      }
      return keys.map((key) => ({
        issueKey: key,
        summary: commit.message,
        existsInJira: false,
      }));
    })
    .flat();
  const issues = await jiraClient.getIssuesByKeys(
    unique(
      changeLog
        .map((item) => item.issueKey)
        .filter((key): key is string => key != null),
    ),
  );
  for (const changelogItem of changeLog) {
    const issue = issues.find((i) => i.key === changelogItem.issueKey);
    if (issue != null) {
      changelogItem.summary = issue.fields.summary;
      changelogItem.existsInJira = true;
    }
  }
  return Object.values(
    changeLog.reduce((a, c) => {
      if (c.issueKey != null) {
        a[c.issueKey] = c;
      } else {
        a[c.summary] = c;
      }
      return a;
    }, {} as Record<string, ChangelogItem>),
  );
}
