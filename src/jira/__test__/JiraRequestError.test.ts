import { JiraRequestError } from '../JiraRequestError';

describe('JiraRequestError', () => {
  describe('toString', () => {
    it('transforms all fields to string correctly', () => {
      const error = new JiraRequestError(
        'test',
        'error',
        {
          data: {
            foo: '1',
          },
          status: 400,
          headers: {
            auth: '123',
          },
          statusText: '123',
        },
        {},
      );
      expect(error.toString()).toBe(
        'message: test\n' +
          'code: error\n' +
          'status: 400\n' +
          'data: {\n' +
          '  "foo": "1"\n' +
          '}\n' +
          'request: {}',
      );
    });
  });
});
