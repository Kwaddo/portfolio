import { describe, expect, test } from 'vitest';
import { isDarkBuffer } from '../src/lib/luminance';

describe('isDarkBuffer', () => {
  test('a mostly black buffer is dark', () => {
    expect(isDarkBuffer(new Uint8Array([10, 20, 30, 40]))).toBe(true);
  });
  test('a light buffer is not dark', () => {
    expect(isDarkBuffer(new Uint8Array([200, 220, 240]))).toBe(false);
  });
  test('the threshold sits at a mean of 90', () => {
    expect(isDarkBuffer(new Uint8Array([89, 89]))).toBe(true);
    expect(isDarkBuffer(new Uint8Array([90, 90]))).toBe(false);
  });
  test('an empty buffer is not dark', () => {
    expect(isDarkBuffer(new Uint8Array([]))).toBe(false);
  });
});
