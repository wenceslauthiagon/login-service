export default class PaginatedResult<T> {
  public totalPages: number;
  public page: number;
  public limitPerpage: number;
  public numberEntries: number;
  public offset: number;
  public data: T;

  constructor(page = 1, totalCount = 0, limitPerpage = 10) {
    this.limitPerpage = Math.min(Math.max(Number(limitPerpage) || 10, 1), 100);
    this.page = this.adjustFetchedPage(Number(page) || 1, totalCount);
    this.offset = this.page * this.limitPerpage - this.limitPerpage;
    this.numberEntries = totalCount;
  }

  private adjustFetchedPage(page: number, totalCount: number) {
    this.totalPages = Math.ceil(totalCount / this.limitPerpage);

    if (totalCount <= 0 || !page || page <= 0) return 1;

    return this.totalPages >= page ? page : this.totalPages;
  }
}