import { DocumentValidator } from './document.validator';

export class RgValidator implements DocumentValidator {
  validate(value: string): boolean {
    const v = this.normalize(value);
    // Basic check: 9 digits
    return /^[0-9]{9}$/.test(v);
  }

  normalize(value: string): string {
    return (value || '').replace(/\D+/g, '');
  }
}
