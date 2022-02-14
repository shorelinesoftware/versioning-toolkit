import Mock = jest.Mock;
import MaybeMockedDeep = jest.MaybeMockedDeep;

export type Mocked<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]: T[P] extends (...arg: any[]) => any
    ? Mock<ReturnType<T[P]>, Parameters<T[P]>>
    : MaybeMockedDeep<T[P]>;
};
