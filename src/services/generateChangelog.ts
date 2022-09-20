import { IGithubClient } from '../github/GithubClient';
import { Commit } from '../github/types';
import { IJiraClient } from '../jira/types';
import { Tag } from '../models/Tag';
import { ChangelogItem } from '../types';
import { unique } from '../utils';

export const JIRA_KEY_REGEXP = /((?<!([A-Za-z]{1,10})-?)[A-Z]+-[1-9]\d*)/g;

export type GenerateChangelogParams = {
  rawHeadTag: string;
};

export type GenerateChangelog = (
  params: GenerateChangelogParams,
) => Promise<ChangelogItem[]>;

export type GenerateChangelogBuilder = typeof generateChangelogBuilder;

function getChangeLog(commits: Commit[]) {
  const changeLog: ChangelogItem[] = commits
    .map((commit) => {
      const keys = unique(commit.message.match(JIRA_KEY_REGEXP) ?? []);
      if (keys.length === 0) {
        return {
          summary: commit.message,
          issueKey: undefined,
          existsInJira: false as const,
          type: 'unknown' as const,
        };
      }
      return keys.map((key) => ({
        issueKey: key,
        summary: commit.message,
        existsInJira: false,
        type: 'unknown' as const,
      }));
    })
    .flat();
  return changeLog;
}

export function generateChangelogBuilder(
  githubClient: IGithubClient,
  jiraClient: IJiraClient,
  info: (message: string) => void,
): GenerateChangelog {
  return async ({ rawHeadTag }: GenerateChangelogParams) => {
    const headTag = new Tag(rawHeadTag);
    // const tags = ["master-1.3.8, master-1.3.9"]; // await githubClient.listSemVerTags(true);
    const baseTag = new Tag('master-1.3.9'); // Tag.getPreviousTag(tags, headTag);
    if (baseTag == null) {
      return [];
    }
    const commits = await githubClient.compareTags(baseTag, headTag);
    let prevIssueKeys: (string | undefined)[] | undefined = undefined;
    if (
      baseTag.minorSegment < headTag.minorSegment ||
      baseTag.majorSegment < headTag.majorSegment
    ) {
      let prevCommits = await githubClient.compareTags(
        baseTag.resetPatchSegment(),
        baseTag,
      );
      if (prevCommits.length === 0) {
        prevCommits = await githubClient.compareTags(
          // in case if started tag has patch segment equal not to 0 but to 1
          baseTag.resetPatchSegment().bumpPatchSegment(),
          baseTag,
        );
      }
      prevIssueKeys = getChangeLog(prevCommits).map(
        (changeLogItem) => changeLogItem.issueKey,
      );
    }
    const changeLog = getChangeLog(commits).filter((changeLogItem) => {
      if (!changeLogItem.issueKey) {
        return true;
      }
      return !prevIssueKeys?.includes(changeLogItem.issueKey);
    });
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
        changelogItem.type = issue.fields.issuetype.name;
      } else if (changelogItem.issueKey) {
        info(
          `${changelogItem.issueKey} does not exist in Jira or user has no access to it`,
        );
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
  };
}
