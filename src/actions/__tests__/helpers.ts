import { AssertToHaveBeenAnyNthCalledWithParams } from '../../testUtils';
import { ActionTypes, Inputs } from '../../types';
import { InputOptions } from '../actionAdapter';
import { mockedActionAdapter, mockedServiceLocator } from './mocks';

export function assertSingleActionIsCalled(excludedActionName: ActionTypes) {
  // eslint-disable-next-line github/array-foreach
  Object.entries(mockedServiceLocator)
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
