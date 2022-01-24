import {
  getInput as getInputFn,
  info as infoFn,
  setOutput as setOutputFn,
  setFailed as setFailedFn,
} from '@actions/core';

export type ActionAdapter = {
  getInput: typeof getInputFn;
  info: typeof infoFn;
  setOutput: typeof setOutputFn;
  setFailed: typeof setFailedFn;
};

export function getActionAdapter(): ActionAdapter {
  return {
    getInput: getInputFn,
    info: infoFn,
    setOutput: setOutputFn,
    setFailed: setFailedFn,
  };
}
