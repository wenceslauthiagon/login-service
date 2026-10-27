export default class PaginatedResult<T> {
  public totalPages: number;
  public page: number;
  public pageSize: number;
  public totalRecords: number;
  public offset: number;
  public data: T;

  constructor(page = 0, totalRecords = 0, pageSize = 10) {
    this.page = Math.max(Number(page) || 0, 0);
    this.pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    this.totalPages = Math.ceil(totalRecords / this.pageSize);
    this.offset = this.page * this.pageSize;
    this.totalRecords = totalRecords;
  }
}