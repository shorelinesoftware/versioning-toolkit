import axios, { AxiosRequestTransformer } from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { toBasicAuth } from '../../utils';
import { JiraClient } from '../JiraClient';
import { JiraRequestError } from '../JiraRequestError';
import {
  CustomField,
  IssueFieldUpdates,
  SearchRequestParams,
  SearchResponse,
} from '../types';
import { buildJiraUrl } from '../utils';
const axiosMock = new AxiosMockAdapter(axios, { onNoMatch: 'throwException' });

function ensureAuthHeader(jiraUser: { email: string; token: string }) {
  return (headers: AxiosRequestTransformer) => {
    expect(headers).toMatchObject({
      authorization: toBasicAuth(jiraUser.email, jiraUser.token),
    });
    return true;
  };
}

describe('JiraClient', () => {
  const jiraUser = {
    email: 'foo',
    token: 'bar',
  };
  const orgOrigin = 'https://shorelineio.atlassian.net';
  beforeEach(() => {
    axiosMock.reset();
  });
  const jiraClient = new JiraClient(jiraUser, orgOrigin);
  describe('constructor', () => {
    it('throws exception if orgOrigin is not correct', () => {
      expect(() => new JiraClient(jiraUser, 'abc')).toThrow('Invalid URL');
    });
    it('throws exception if orgOrigin is empty', () => {
      expect(() => new JiraClient(jiraUser, '')).toThrow('Invalid URL');
    });
  });

  describe('getIssuesByKeys', () => {
    const searchResponse: SearchResponse = {
      maxResults: 2,
      startAt: 0,
      totalNumber: 2,
      issues: [
        {
          id: 1,
          key: 'FOO-1',
          fields: {
            summary: '',
            issueType: {
              id: 1,
              name: '',
            },
          },
        },
        {
          id: 2,
          key: 'FOO-2',
          fields: {
            summary: '',
            issueType: {
              id: 1,
              name: '',
            },
          },
        },
      ],
    };

    it('makes correct request', async () => {
      const expectedSearchRequestParams: SearchRequestParams = {
        maxResults: 100,
        startAt: 0,
        jql: 'key in (FOO-1,FOO-2)',
      };
      axiosMock
        .onPost(
          buildJiraUrl(new URL(orgOrigin), '/search'),
          {
            asymmetricMatch: (params: SearchRequestParams) => {
              expect(params).toEqual(expectedSearchRequestParams);
              return true;
            },
          },
          {
            asymmetricMatch: ensureAuthHeader(jiraUser),
          },
        )
        .reply(200, searchResponse);
      const result = await jiraClient.getIssuesByKeys(['FOO-1', 'FOO-2']);
      expect(result).toEqual(searchResponse.issues);
    });
  });
  describe('getCustomFields', () => {
    const fieldsResponse: CustomField[] = [
      {
        id: 'statuscategorychangedate',
        name: 'Status Category Changed',
      },
      {
        id: 'issuetype',
        name: 'Issue Type',
      },
    ];

    it('makes correct request', async () => {
      axiosMock
        .onGet(buildJiraUrl(new URL(orgOrigin), '/field'), undefined, {
          asymmetricMatch: ensureAuthHeader(jiraUser),
        })
        .reply(200, fieldsResponse);
      const result = await jiraClient.getCustomFields();
      expect(result).toEqual(fieldsResponse);
    });
  });
  describe('updateIssue', () => {
    it('makes correct request', async () => {
      const issueKey = 'FOO-1';
      const issueFieldUpdates: IssueFieldUpdates = {
        fields: {
          ['customfield']: ['1'],
        },
      };
      axiosMock
        .onPut(
          buildJiraUrl(new URL(orgOrigin), `/issue/${issueKey}`),
          {
            asymmetricMatch: (body: IssueFieldUpdates) => {
              expect(body).toEqual(issueFieldUpdates);
              return true;
            },
          },
          {
            asymmetricMatch: ensureAuthHeader(jiraUser),
          },
        )
        .reply(200);
      await jiraClient.updateIssue(issueFieldUpdates, issueKey);
    });
  });
  it('rethrows JiraRequestError', async () => {
    axiosMock.onAny().reply(400);
    await expect(async () =>
      jiraClient.getCustomFields(),
    ).rejects.toBeInstanceOf(JiraRequestError);
  });
});
