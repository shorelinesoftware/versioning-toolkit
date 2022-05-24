import { ListRequestParams } from './types';

function hasKey<K extends string>(
  k: K,
  o: unknown,
): o is { [_ in K]: unknown } {
  return typeof o === 'object' && o != null && k in o;
}

export function isNotFoundError(error: unknown) {
  return (
    hasKey('status', error) &&
    typeof error.status === 'number' &&
    error.status === 404
  );
}

export type FetchPagesParams<TPageItem> = {
  fetchFn: (params: ListRequestParams) => Promise<TPageItem[]>;
  shouldFetchAll: boolean;
  fetchedItems: TPageItem[];
  initialPage: number;
};

async function fetchPagesCore<TPageItem>({
  fetchedItems,
  fetchFn,
  initialPage,
  shouldFetchAll,
}: FetchPagesParams<TPageItem>): Promise<TPageItem[]> {
  const perPage = 100;

  const response = await fetchFn({
    per_page: perPage,
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
  });
}

export async function fetchPages<TPageItem>(
  params: Omit<FetchPagesParams<TPageItem>, 'fetchedItems'>,
): Promise<TPageItem[]> {
  return fetchPagesCore({
    ...params,
    fetchedItems: [],
  });
}
