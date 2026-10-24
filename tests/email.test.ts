import { describe, expect, test } from 'vitest';
import { toAddress, toSpelledOut } from '../src/lib/email';

const parts = { user: 'jo', domain: 'mail.example.co.uk' };

describe('email', () => {
  test('joins user and domain', () => {
    expect(toAddress(parts)).toBe('jo@mail.example.co.uk');
  });
  test('spells out with [at] and [dot]', () => {
    expect(toSpelledOut(parts)).toBe('jo [at] mail [dot] example [dot] co [dot] uk');
  });
  test('the spelled-out form never contains an @', () => {
    expect(toSpelledOut(parts)).not.toContain('@');
  });
});
