export interface ResponseMetadata {
  domains: string[];
  api_version: string;
}

export interface ResponsePagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface DomainResponse<T> {
  metadados: ResponseMetadata;
  data: T;
  pagination?: ResponsePagination;
  message: string;
}
