export interface IJiraClient {
  getIssuesByKeys: (keys: string[]) => Promise<Issue[]>;
  getCustomFields: () => Promise<CustomField[]>;
  updateIssue: (
    issueFieldUpdates: IssueFieldUpdates,
    issueKey: string,
  ) => Promise<void>;
}

export type CustomField = {
  id: string;
  name: string;
};

export type IssueFieldUpdates = {
  fields: {
    [customField: string]: unknown;
  };
};

export type SearchRequestParams = {
  jql: `key in (${string})`;
  startAt: number;
  maxResults: number;
};

export type SearchResponse = {
  startAt: number;
  maxResults: number;
  totalNumber: number;
  issues: Issue[];
};

export type JiraUser = {
  email: string;
  token: string;
};

export type Issue = {
  id: number;
  key: string;
  fields: {
    issueType: {
      id: number;
      name: string;
    };
    summary: string;
    [customField: string]: unknown;
  };
};
