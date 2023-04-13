export default class PaginetdHelper<T> {
  public totalPages: number;
  public page: number;
  public limitPerpage: number;
  public numberEntries: number;
  public offset: number;
  public data: T;

  constructor(page: number, totalCount: number, limitPerpage: number) {
    this.limitPerpage = limitPerpage;
    this.page = this.adjustFetchedPage(page, totalCount);
    this.offset = this.page * this.limitPerpage - this.limitPerpage;
    this.numberEntries = totalCount;
  }

  private adjustFetchedPage(page: number, totalCount: number) {
    this.totalPages = Math.ceil(totalCount / this.limitPerpage);

    if (totalCount <= 0 || !page || page <= 0) return 1;

    return this.totalPages >= page ? page : this.totalPages;
  }
}
