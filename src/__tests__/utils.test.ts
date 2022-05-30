import { PaginationParams } from '../types';
import { fetchPages, toBasicAuth } from '../utils';

describe('fetchPages', () => {
  const list = [1, 2, 3, 4, 5, 6, 7];

  it('fetches all pages when shouldFetchAll is true', async () => {
    const perPage = 2;
    const fetchFn = jest.fn<Promise<number[]>, [PaginationParams]>(
      async ({ page }) => {
        const currentPageItems = list.slice(
          page * perPage,
          (page + 1) * perPage,
        );
        return Promise.resolve(currentPageItems);
      },
    );
    const result = await fetchPages({
      shouldFetchAll: true,
      fetchFn,
      perPage,
    });
    expect(result).toEqual(list);
  });
  it('fetches first page only when shouldFetchAll is false', async () => {
    const fetchFn = jest.fn<Promise<number[]>, [PaginationParams]>(async () => {
      return Promise.resolve([]);
    });
    const result = await fetchPages({
      shouldFetchAll: true,
      fetchFn,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});

describe('toBasicAuth', () => {
  it('converts name and password into basic auth', () => {
    expect(toBasicAuth('foo', 'bar')).toBe('Basic Zm9vOmJhcg==');
  });
});
