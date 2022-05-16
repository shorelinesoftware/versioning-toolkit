import {
  getInput as getInputFn,
  info as infoFn,
  setOutput as setOutputFn,
  setFailed as setFailedFn,
} from '@actions/core';
import { context } from '@actions/github';

export { InputOptions } from '@actions/core';

export type ActionAdapter = {
  getInput: typeof getInputFn;
  info: typeof infoFn;
  setOutput: typeof setOutputFn;
  setFailed: typeof setFailedFn;
  sha: string;
};

export function getActionAdapter(): ActionAdapter {
  return {
    getInput: getInputFn,
    info: infoFn,
    setOutput: setOutputFn,
    setFailed: setFailedFn,
    sha: context.sha,
  };
}
