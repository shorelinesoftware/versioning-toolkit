export function getBranchName(branch: string) {
  return branch.replace('refs/heads/', '');
}
