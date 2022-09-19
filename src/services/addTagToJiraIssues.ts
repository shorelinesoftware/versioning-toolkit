import { IJiraClient } from '../jira/types';
import { Tag } from '../models/Tag';
import { unique } from '../utils';
import { GenerateChangelog } from './generateChangelog';

export type AddTagToJiraIssuesParams = {
  rawTag: string;
  tagFieldName: string;
  prefix: string | undefined;
  additionalTag: string | undefined;
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

function makeTags(
  tag: Tag,
  prefix: string | undefined,
  additionalTag: string | undefined,
) {
  let result = [tag.value, tag.createBranch()];
  if (prefix) {
    result = [`${prefix}${tag.value}`, `${prefix}${tag.createBranch()}`];
  }
  if (additionalTag) {
    result.push(additionalTag);
  }
  return result;
}

export function addTagToJiraIssuesBuilder(
  generateChangelogService: GenerateChangelog,
  jiraClient: IJiraClient,
  info: (message: string) => void,
): AddTagToJiraIssues {
  return async ({
    rawTag,
    tagFieldName,
    prefix,
    additionalTag,
  }: AddTagToJiraIssuesParams) => {
    // eslint-disable-next-line no-console
    console.log('Enter to AddTagToJiraIssues - rawTag = ', rawTag);

    const tag = new Tag(rawTag);

    // eslint-disable-next-line no-console
    console.log('tag = ', tag);

    const changelog = await generateChangelogService({ rawHeadTag: tag.value });

    // eslint-disable-next-line no-console
    console.log('changelog = ', changelog);

    const issuesKeys = changelog
      .filter((item) => item.existsInJira)
      .map((item) => item.issueKey)
      .filter((item): item is string => item != null);

    // eslint-disable-next-line no-console
    console.log('issuesKeys = ', issuesKeys);

    const issues = await jiraClient.getIssuesByKeys(issuesKeys);

    // eslint-disable-next-line no-console
    console.log('issuesKeys = ', issuesKeys);

    const foundIssueKeys = issues.map((i) => i.key);

    // eslint-disable-next-line no-console
    console.log('foundIssueKeys = ', foundIssueKeys);

    const fields = await jiraClient.getCustomFields();

    // eslint-disable-next-line no-console
    console.log('fields = ', JSON.stringify(fields));

    const tagField = fields.find(
      (field) => field.name.toLowerCase() === tagFieldName.toLowerCase(),
    );

    // eslint-disable-next-line no-console
    console.log('tagField = ', JSON.stringify(tagField));

    if (tagField == null) {
      // eslint-disable-next-line no-console
      console.log('tagField = null');
      return {
        updatedIssues: [],
        allIssues: foundIssueKeys,
      };
    }
    const updatedIssues: string[] = [];
    await Promise.all(
      issues.map(async (issue) => {
        const prevTags = issue.fields[tagField.id] ?? [];
        if (!checkIsStringArray(prevTags)) {
          // eslint-disable-next-line no-console
          console.log(
            '!checkIsStringArray(prevTags) = ',
            JSON.stringify(issue),
          );
          return;
        }
        try {
          // eslint-disable-next-line no-console
          console.log('try to update issue - tagField.id = ', tagField.id);

          const newTags = makeTags(tag, prefix, additionalTag);

          // eslint-disable-next-line no-console
          console.log('newTags = ', JSON.stringify(newTags));

          await jiraClient.updateIssue(
            {
              fields: {
                [tagField.id]: unique([...prevTags, ...newTags]),
              },
            },
            issue.key,
          );

          // eslint-disable-next-line no-console
          console.log('updated issue in JIRA - issue id = ', issue.id);
          updatedIssues.push(issue.key);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('updated issue Error');
          if (e instanceof Error) {
            // eslint-disable-next-line no-console
            console.log('Error Message = ', e.toString());
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
