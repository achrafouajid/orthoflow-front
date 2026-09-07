import { describe, expect, it } from 'vitest';
import { entityString } from './voice-intent.model';

/**
 * The bug this guards against is invisible where it happens. A model returning
 * `"fdi": 16` instead of `"fdi": "16"` still produces a correct clinical
 * record — the write path stringifies it — but every consumer that tested for
 * a string skipped it, so the tooth disappeared from the review chart and the
 * finding could not be removed by voice.
 */
describe('entityString', () => {
  it('passes a string through', () => {
    expect(entityString({ fdi: '16' }, 'fdi')).toBe('16');
  });

  it('accepts the number a model is just as likely to return', () => {
    expect(entityString({ fdi: 16 }, 'fdi')).toBe('16');
  });

  it('returns null for anything that is not a usable identifier', () => {
    expect(entityString({ fdi: null }, 'fdi')).toBeNull();
    expect(entityString({ fdi: '   ' }, 'fdi')).toBeNull();
    expect(entityString({ fdi: NaN }, 'fdi')).toBeNull();
    expect(entityString({}, 'fdi')).toBeNull();
    expect(entityString(undefined, 'fdi')).toBeNull();
  });
});
