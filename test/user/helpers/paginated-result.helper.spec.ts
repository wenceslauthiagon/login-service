import PaginatedResult from '../../../src/user/helpers/paginated-result.helper';

describe('PaginatedResult', () => {
  it('TC0001 - calculates offset and total pages from a zero-based page', () => {
    const result = new PaginatedResult(1, 25, 10);

    expect(result.page).toBe(1);
    expect(result.offset).toBe(10);
    expect(result.totalPages).toBe(3);
    expect(result.totalRecords).toBe(25);
    expect(result.pageSize).toBe(10);
  });

  it('TC0002 - keeps an out-of-range page so the query can return an empty list', () => {
    const result = new PaginatedResult(1, 1, 1);

    expect(result.page).toBe(1);
    expect(result.offset).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('TC0003 - caps page size and defaults invalid pagination values', () => {
    expect(new PaginatedResult(0, 300, 500).pageSize).toBe(100);
    expect(new PaginatedResult(-1, 0, 0).pageSize).toBe(10);
    expect(new PaginatedResult(-1, 0, 10).page).toBe(0);
  });
});