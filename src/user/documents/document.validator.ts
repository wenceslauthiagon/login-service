export interface DocumentValidator {
  validate(value: string): boolean;
  normalize(value: string): string;
}
