import { IJiraClient } from '../jira/types';
import { Tag } from '../models/Tag';
import { unique } from '../utils';
import { GenerateChangelog } from './generateChangelog';

export type AddTagToJiraIssuesParams = {
  rawTag: string;
  tagFieldName: string;
};

function checkIsStringArray(field: unknown): field is string[] {
  return (
    Array.isArray(field) && field.every((item) => typeof item === 'string')
  );
}

export type AddTagToJiraIssues = (params: AddTagToJiraIssuesParams) => Promise<{
  updatedIssues: string[];
  allIssues: string[];
}>;

export type AddTagToJiraIssuesBuilder = typeof addTagToJiraIssuesBuilder;

export function addTagToJiraIssuesBuilder(
  generateChangelogService: GenerateChangelog,
  jiraClient: IJiraClient,
  info: (message: string) => void,
): AddTagToJiraIssues {
  return async ({ rawTag, tagFieldName }: AddTagToJiraIssuesParams) => {
    const tag = new Tag(rawTag);
    const changelog = await generateChangelogService({ rawHeadTag: tag.value });
    const issuesKeys = changelog
      .filter((item) => item.existsInJira)
      .map((item) => item.issueKey)
      .filter((item): item is string => item != null);
    const issues = await jiraClient.getIssuesByKeys(issuesKeys);
    const foundIssueKeys = issues.map((i) => i.key);
    const fields = await jiraClient.getCustomFields();
    const tagField = fields.find(
      (field) => field.name.toLowerCase() === tagFieldName.toLowerCase(),
    );
    if (tagField == null) {
      return {
        updatedIssues: [],
        allIssues: foundIssueKeys,
      };
    }
    const updatedIssues: string[] = [];
    await Promise.all(
      issues.map(async (issue) => {
        const prevTags = issue.fields[tagField.name] ?? [];
        if (!checkIsStringArray(prevTags)) {
          return;
        }
        try {
          await jiraClient.updateIssue(
            {
              fields: {
                [tagField.id]: unique([...prevTags, tag.value]),
              },
            },
            issue.key,
          );
          updatedIssues.push(issue.key);
        } catch (e) {
          if (e instanceof Error) {
            info(e.toString());
          }
        }
      }),
    );
    return {
      updatedIssues,
      allIssues: foundIssueKeys,
    };
  };
}
