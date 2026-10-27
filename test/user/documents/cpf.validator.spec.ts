import { CpfValidator } from '../../../src/user/documents/cpf.validator';

describe('CpfValidator', () => {
  const validator = new CpfValidator();

  it('TC0001 - normalizes CPF punctuation', () => {
    expect(validator.normalize('529.982.247-25')).toBe('52998224725');
  });

  it('TC0002 - accepts a valid CPF', () => {
    expect(validator.validate('529.982.247-25')).toBe(true);
  });

  it('TC0003 - rejects invalid and repeated-digit CPFs', () => {
    expect(validator.validate('52998224724')).toBe(false);
    expect(validator.validate('11111111111')).toBe(false);
  });
});