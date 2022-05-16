import Mock = jest.Mock;

export type Mocked<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends (...arg: any[]) => any
    ? Mock<ReturnType<T[P]>, Parameters<T[P]>>
    : T[P];
};

export function AssertToHaveBeenAnyNthCalledWithParams<
  TFn extends (...args: TParams) => unknown,
  TParams extends unknown[],
>(mockedFn: jest.Mock<ReturnType<TFn>, TParams>, ...params: TParams) {
  expect(mockedFn).toBeCalled();
  expect(mockedFn.mock.calls).toContainEqual(params);
}
