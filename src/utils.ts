export function getBranchName(branch: string) {
  return branch.replace('refs/heads/', '');
}

export function assertUnreachable(value: never): never {
  throw new Error(`${value} should be unreachable`);
}
