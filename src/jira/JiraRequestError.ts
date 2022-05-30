import { AxiosError } from 'axios';

export class JiraRequestError extends Error {
  status: number;
  errors: unknown;
  headers: Record<string, string> | undefined;
  constructor(error: unknown) {
    const axiosError = error as AxiosError;
    if (axiosError.isAxiosError) {
      super(axiosError.message);
      this.status = axiosError.response?.status ?? 0;
      this.errors = axiosError.response?.data;
      this.headers = axiosError.response?.headers;
      return;
    }
    throw error;
  }
}
