import axios from 'axios';
import { PaginationParams } from '../types';
import { fetchPages, toBasicAuth } from '../utils';
import { JiraRequestError } from './JiraRequestError';
import {
  CustomField,
  IJiraClient,
  Issue,
  IssueFieldUpdates,
  JiraUser,
  SearchRequestParams,
  SearchResponse,
} from './types';
import { buildJiraUrl } from './utils';

type JiraRequestOptions =
  | {
      method: 'GET' | 'POST' | 'PUT';
      path: string;
      body?: never;
      query?: Record<string, unknown>;
    }
  | {
      method: 'POST' | 'PUT';
      path: string;
      body?: object;
      query?: Record<string, unknown>;
    };

export class JiraClient implements IJiraClient {
  private _jiraUser: JiraUser;
  private _orgOrigin: URL;

  constructor(jiraUser: JiraUser, orgDomain: string) {
    this._jiraUser = jiraUser;
    this._orgOrigin = new URL(orgDomain);
  }

  private async request<TResponse>(options: JiraRequestOptions) {
    try {
      const response = await axios.request({
        baseURL: ``,
        url: buildJiraUrl(this._orgOrigin, options.path),
        method: options.method,
        headers: {
          authorization: toBasicAuth(
            this._jiraUser.email,
            this._jiraUser.token,
          ),
        },
        params: options.query,
        data: options.body,
      });
      return response.data as TResponse;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        throw new JiraRequestError(
          e.message,
          e.code,
          e.response != null
            ? {
                headers: e.response.headers,
                data: e.response.data,
                status: e.response.status,
                statusText: e.response.statusText,
              }
            : undefined,
          e.request,
        );
      }
      throw e;
    }
  }

  async updateIssue(issueFieldUpdates: IssueFieldUpdates, issueKey: string) {
    await this.request({
      method: 'PUT',
      body: issueFieldUpdates,
      path: `/issue/${issueKey}`,
    });
  }

  async getCustomFields(): Promise<CustomField[]> {
    return this.request<CustomField[]>({
      path: '/field',
      method: 'GET',
    });
  }

  async getIssuesByKeys(keys: string[]): Promise<Issue[]> {
    const getSearchRequestParams = ({
      page,
      perPage,
    }: PaginationParams): SearchRequestParams => {
      return {
        jql: `key in (${keys.join(',')})`,
        maxResults: perPage,
        startAt: page,
      };
    };
    if (keys.length === 0) {
      return [];
    }
    return fetchPages({
      shouldFetchAll: true,
      fetchFn: async (listRequestParams) => {
        const result = await this.request<SearchResponse>({
          path: '/search',
          body: getSearchRequestParams(listRequestParams),
          method: 'POST',
        });
        return result.issues;
      },
    });
  }
}
