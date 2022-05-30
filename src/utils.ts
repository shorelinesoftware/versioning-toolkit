import { PaginationParams } from './types';

export function getBranchName(branch: string) {
  return branch.replace('refs/heads/', '');
}

export function assertUnreachable(value: never): never {
  throw new Error(`${value} should be unreachable`);
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export type FetchPagesParams<TPageItem> = {
  fetchFn: (params: PaginationParams) => Promise<TPageItem[]>;
  shouldFetchAll: boolean;
  fetchedItems: TPageItem[];
  initialPage: number;
  perPage?: number;
};

async function fetchPagesCore<TPageItem>({
  fetchedItems,
  fetchFn,
  initialPage,
  perPage = 100,
  shouldFetchAll,
}: FetchPagesParams<TPageItem>): Promise<TPageItem[]> {
  const response = await fetchFn({
    perPage,
    page: initialPage,
  });
  if (response.length < perPage || !shouldFetchAll) {
    return [...fetchedItems, ...response];
  }

  return fetchPagesCore({
    shouldFetchAll,
    fetchedItems: [...fetchedItems, ...response],
    fetchFn,
    initialPage: initialPage + 1,
    perPage,
  });
}

export async function fetchPages<TPageItem>(
  params: Omit<FetchPagesParams<TPageItem>, 'fetchedItems' | 'initialPage'>,
): Promise<TPageItem[]> {
  return fetchPagesCore({
    ...params,
    initialPage: 0,
    fetchedItems: [],
  });
}

export function toBasicAuth(name: string, password: string) {
  return `Basic ${Buffer.from(`${name}:${password}`).toString('base64')}`;
}
