import { CpfValidator } from './cpf.validator';
import { RgValidator } from './rg.validator';
import { DocumentValidator } from './document.validator';

export class DocumentFactory {
  static getValidator(value: string): DocumentValidator {
    const digits = (value || '').replace(/\D+/g, '');
    if (digits.length === 11) return new CpfValidator();
    if (digits.length === 9) return new RgValidator();
    // default to CPF validator to produce a meaningful error
    return new CpfValidator();
  }
}
