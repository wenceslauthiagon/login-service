import { RgValidator } from '../../../src/user/documents/rg.validator';

describe('RgValidator', () => {
  const validator = new RgValidator();

  it('TC0001 - normalizes punctuation and accepts nine digits', () => {
    expect(validator.normalize('12.345.678-9')).toBe('123456789');
    expect(validator.validate('12.345.678-9')).toBe(true);
  });

  it('TC0002 - rejects values with a different number of digits', () => {
    expect(validator.validate('12345678')).toBe(false);
  });
});