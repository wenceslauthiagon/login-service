import { DocumentValidator } from './document.validator';

export class CpfValidator implements DocumentValidator {
  validate(value: string): boolean {
    const v = this.normalize(value);
    if (!/^[0-9]{11}$/.test(v)) return false;
    // reject same digits
    if (/^(\d)\1{10}$/.test(v)) return false;

    const calc = (digits: string, factor: number) => {
      let total = 0;
      for (let i = 0; i < digits.length; i++) {
        total += Number(digits.charAt(i)) * (factor - i);
      }
      const mod = total % 11;
      return mod < 2 ? 0 : 11 - mod;
    };

    const dv1 = calc(v.slice(0, 9), 10);
    const dv2 = calc(v.slice(0, 9) + dv1, 11);

    return dv1 === Number(v.charAt(9)) && dv2 === Number(v.charAt(10));
  }

  normalize(value: string): string {
    return (value || '').replace(/\D+/g, '');
  }
}
