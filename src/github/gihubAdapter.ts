import { context, getOctokit } from '@actions/github';
import { GithubAdapter } from './types';

export function getGithubAdapter(githubToken: string): GithubAdapter {
  const octokit = getOctokit(githubToken);

  return {
    listTags: async (params) => {
      return octokit.rest.repos
        .listTags({
          ...context.repo,
          ...params,
        })
        .then((response) => response.data);
    },
    createRef: async (ref) => {
      await octokit.rest.git.createRef({
        ...context.repo,
        ref,
        sha: context.sha,
      });
    },
  };
}
