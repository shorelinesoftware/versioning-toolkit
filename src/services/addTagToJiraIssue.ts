import { IJiraClient } from '../jira/types';
import { Tag } from '../models/Tag';
import { GenerateChangelog } from './generateChangelog';

export type AddTagToJiraIssuesParams = {
  rawTag: string;
  issuesKeys: string[];
  tagFieldName: string;
};

function checkIsStringArray(field: unknown): field is string[] {
  return (
    Array.isArray(field) && field.every((item) => typeof item === 'string')
  );
}

export type AddTagToJiraIssues = (
  params: AddTagToJiraIssuesParams,
) => Promise<string[]>;

export type AddTagToJiraIssuesBuilder = typeof addTagToJiraIssuesBuilder;

export function addTagToJiraIssuesBuilder(
  generateChangelogService: GenerateChangelog,
  jiraClient: IJiraClient,
): AddTagToJiraIssues {
  return async ({ rawTag, tagFieldName }: AddTagToJiraIssuesParams) => {
    const tag = new Tag(rawTag);
    const changelog = await generateChangelogService({ rawHeadTag: tag.value });
    const issuesKeys = changelog
      .filter((item) => item.existsInJira)
      .map((item) => item.issueKey)
      .filter((item): item is string => item != null);
    const issues = await jiraClient.getIssuesByKeys(issuesKeys);
    const fields = await jiraClient.getCustomFields();
    const tagField = fields.find(
      (field) => field.name.toLowerCase() === tagFieldName.toLowerCase(),
    );
    if (tagField == null) {
      return [];
    }
    const updatedIssues: string[] = [];
    await Promise.all(
      issues.map((issue) => {
        const prevTags = issue.fields[tagField.name];
        if (!checkIsStringArray(prevTags)) {
          return;
        }
        return jiraClient
          .updateIssue(
            {
              fields: {
                [tagField.name]: [...prevTags, tag.value],
              },
            },
            issue.key,
          )
          .then(() => updatedIssues.push(issue.key))
          .catch(() => {});
      }),
    );
    return updatedIssues;
  };
}
