import { AssertToHaveBeenAnyNthCalledWithParams } from '../../../testUtils';
import { Inputs } from '../../../types';
import { InputOptions } from '../../actionAdapter';
import { Actions } from '../../actionRunner';
import { mockedActionAdapter, mockedActions } from './mocks';

export function assertSingleActionIsCalled(excludedActionName: keyof Actions) {
  // eslint-disable-next-line github/array-foreach
  Object.entries(mockedActions)
    .filter(([key]) => key !== excludedActionName)
    .forEach(([, value]) => expect(value).not.toHaveBeenCalled());
}

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
