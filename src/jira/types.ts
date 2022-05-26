export interface IJiraClient {
  getIssuesByKeys: (keys: string[]) => Promise<Issue[]>;
  getCustomField: (fieldName: string) => Promise<CustomField | undefined>;
  updateIssue: (
    updatedIssue: IssueFieldUpdates,
    issueKey: string,
  ) => Promise<void>;
}

export type CustomField = {
  id: number;
  name: string;
};

export type IssueFieldUpdates = {
  fields: {
    [customField: string]: unknown;
  };
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
