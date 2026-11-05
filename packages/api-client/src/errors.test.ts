import { describe, expect, it } from 'vitest';
import { ApiError } from './index';

describe('ApiError', () => {
  it('prefers field-level validation messages', () => {
    const e = new ApiError(400, {
      message: 'Validation failed',
      errors: [
        { message: 'MRP can’t be lower than the selling price' },
        { message: 'Choose a category' },
      ],
    });
    expect(e.message).toBe('MRP can’t be lower than the selling price. Choose a category');
  });
  it('falls back to the message or status', () => {
    expect(new ApiError(409, { message: 'Already exists' }).message).toBe('Already exists');
    expect(new ApiError(502, null).message).toBe('HTTP 502');
  });
});
