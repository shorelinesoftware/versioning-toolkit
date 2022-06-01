import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { Inputs } from '../../types';
import { InputOptions } from '../actionAdapter';
import { mockedActionAdapter } from './mocks';

export function assertGetInputIsCalled(
  inputName: Inputs,
  inputOptions?: InputOptions,
) {
  AssertToHaveBeenAnyNthCalledWithParams(
    mockedActionAdapter.getInput,
    inputName,
    inputOptions,
  );
}
