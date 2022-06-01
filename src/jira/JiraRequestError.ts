export class JiraRequestError extends Error {
  constructor(
    message: string,
    public code: string | undefined,
    public response:
      | {
          data: unknown;
          status: number;
          statusText: string;
          headers: Record<string, string> | undefined;
        }
      | undefined,
    public request: unknown,
  ) {
    super(message);
    this.name = 'JiraRequestError';
  }

  toString() {
    return (
      `message: ${this.message}` +
      `\n` +
      `code: ${this.code}` +
      '\n' +
      `status: ${this.response?.status}` +
      '\n' +
      `data: ${JSON.stringify(this.response?.data, undefined, 2)}` +
      `\n` +
      `request: ${JSON.stringify(this.request, undefined, 2)}`
    );
  }
}
