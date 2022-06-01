import { JiraRequestError } from '../JiraRequestError';

describe('JiraRequestError', () => {
  describe('toString', () => {
    it('formats error', () => {
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
        '/foo',
        'POST',
      );
      expect(error.toString()).toBe(
        'message: test\n' +
          'code: error\n' +
          'status: 400\n' +
          'data: {\n' +
          '  "foo": "1"\n' +
          '}\n' +
          'url: /foo\n' +
          'method: POST',
      );
    });
  });
});
