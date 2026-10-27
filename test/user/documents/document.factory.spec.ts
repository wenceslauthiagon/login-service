import { CpfValidator } from '../../../src/user/documents/cpf.validator';
import { DocumentFactory } from '../../../src/user/documents/document.factory';
import { RgValidator } from '../../../src/user/documents/rg.validator';

describe('DocumentFactory', () => {
  it('TC0001 - selects CPF validation for eleven digits', () => {
    expect(DocumentFactory.getValidator('529.982.247-25')).toBeInstanceOf(
      CpfValidator,
    );
  });

  it('TC0002 - selects RG validation for nine digits', () => {
    expect(DocumentFactory.getValidator('12.345.678-9')).toBeInstanceOf(
      RgValidator,
    );
  });

  it('TC0003 - defaults to CPF validation for unsupported document lengths', () => {
    expect(DocumentFactory.getValidator('12345678')).toBeInstanceOf(
      CpfValidator,
    );
    expect(DocumentFactory.getValidator('')).toBeInstanceOf(CpfValidator);
  });
});