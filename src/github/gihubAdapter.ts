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
    createRef: async (ref, sha) => {
      await octokit.rest.git.createRef({
        ...context.repo,
        ref,
        sha,
      });
    },
    getRef: async (ref) => {
      return octokit.rest.git
        .getRef({
          ...context.repo,
          ref,
        })
        .then((response) => response.data);
    },
    getBranch: async (branch) => {
      return await octokit.rest.repos
        .getBranch({
          ...context.repo,
          branch,
        })
        .then((response) => response.data.name);
    },
    deleteRef: async (ref: string) => {
      return await octokit.rest.git
        .deleteRef({
          ...context.repo,
          ref,
        })
        .then(() => undefined);
    },
    compareRefs: async ({ baseRef, headRef, page, per_page }) => {
      return await octokit.rest.repos
        .compareCommits({
          ...context.repo,
          per_page,
          page,
          head: headRef,
          base: baseRef,
        })
        .then((response) =>
          response.data.commits.map((commit) => ({
            sha: commit.sha,
            message: commit.commit.message,
          })),
        );
    },
  };
}
