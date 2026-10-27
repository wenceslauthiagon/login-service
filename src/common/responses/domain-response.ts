import {
  DomainResponse,
  ResponsePagination,
} from '../interfaces/domain-response.interface';

export function createDomainResponse<T>(
  domain: string,
  data: T,
  message: string,
  pagination?: ResponsePagination,
): Record<string, DomainResponse<T>> {
  return {
    [domain]: {
      metadados: {
        domains: [domain],
        api_version: '1.0',
      },
      data,
      ...(pagination ? { pagination } : {}),
      message,
    },
  };
}
