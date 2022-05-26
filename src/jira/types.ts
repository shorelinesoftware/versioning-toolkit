export interface IJiraClient {
  getIssuesByKeys: (keys: string[]) => Promise<Issue[]>;
  getCustomField: (fieldName: string) => Promise<CustomField | undefined>;
  updateIssue: (updatedIssue: Issue) => Promise<void>;
}

export type CustomField = {
  id: string;
  name: string;
};

export type Issue = {
  id: string;
  key: string;
  fields: {
    issueType: {
      id: string;
      name: string;
    };
    summary: string;
    [customField: string]: unknown;
  };
};
