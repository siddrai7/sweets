import { describe, expect, it } from 'vitest';
import { amountInWords, financialYear } from './invoice-utils';

describe('financialYear', () => {
  it('starts on 1 April in India (IST)', () => {
    expect(financialYear(new Date('2026-03-31T18:00:00Z'))).toBe('25-26'); // 31 Mar 23:30 IST
    expect(financialYear(new Date('2026-03-31T18:31:00Z'))).toBe('26-27'); // 1 Apr 00:01 IST
    expect(financialYear(new Date('2026-11-04T08:00:00Z'))).toBe('26-27');
    expect(financialYear(new Date('2027-01-15T08:00:00Z'))).toBe('26-27');
  });
});

describe('amountInWords', () => {
  it('uses the Indian numbering system', () => {
    expect(amountInWords(1400)).toBe('Rupees One Thousand Four Hundred Only');
    expect(amountInWords(0)).toBe('Rupees Zero Only');
    expect(amountInWords(115)).toBe('Rupees One Hundred Fifteen Only');
    expect(amountInWords(250000)).toBe('Rupees Two Lakh Fifty Thousand Only');
    expect(amountInWords(12345678)).toBe(
      'Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only',
    );
  });
  it('includes paise', () => {
    expect(amountInWords(489.5)).toBe('Rupees Four Hundred Eighty Nine and Fifty Paise Only');
    expect(amountInWords(20.95)).toBe('Rupees Twenty and Ninety Five Paise Only');
  });
});
