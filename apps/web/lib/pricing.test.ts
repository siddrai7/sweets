import { describe, expect, it } from 'vitest';
import { deliveryFeeFor, percentOff, perKg } from './pricing';
import { site } from './site';

describe('pricing', () => {
  it('percentOff rounds and ignores non-discounts', () => {
    expect(percentOff({ price: '480', mrp: '540' })).toBe(11);
    expect(percentOff({ price: '480', mrp: null })).toBe(0);
    expect(percentOff({ price: '480', mrp: '400' })).toBe(0);
  });
  it('perKg only for weighed sizes', () => {
    expect(perKg({ price: '320', weightGrams: 250 })).toBe(1280);
    expect(perKg({ price: '220', weightGrams: null })).toBeNull();
  });
  it('mirrors the API delivery fee rule', () => {
    expect(deliveryFeeFor(0)).toBe(0);
    expect(deliveryFeeFor(site.freeDeliveryAbove - 1)).toBe(site.deliveryFee);
    expect(deliveryFeeFor(site.freeDeliveryAbove)).toBe(0);
    expect(deliveryFeeFor(100, 'PICKUP')).toBe(0);
  });
});
