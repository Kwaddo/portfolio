import { describe, expect, test } from 'vitest';
import { findViolations } from '../scripts/dist-rules';

const ok = '<html><body><h1>Ali Khalaf</h1><a href="https://github.com/Kwaddo">GitHub</a></body></html>';

describe('findViolations', () => {
  test('a clean page passes, and a handle inside a URL is allowed', () => {
    expect(findViolations('index.html', ok)).toEqual([]);
  });
  test('flags AI tooling names', () => {
    expect(findViolations('a/index.html', '<p>Built with Claude</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<p>co-authored-by someone</p>')).toHaveLength(1);
  });
  test('flags the phone number', () => {
    expect(findViolations('a/index.html', '<p>+973-36000253</p>')).toHaveLength(1);
  });
  test('flags a plain email address and a mailto link in markup', () => {
    expect(findViolations('a/index.html', '<p>alimohsen999@gmail.com</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="mailto:x@y.z">x</a>')).toHaveLength(1);
  });
  test('allows the string mailto: inside a script (the client-side assembler)', () => {
    expect(findViolations('a/index.html', '<script>link.href=`mailto:${a}`</script>')).toEqual([]);
  });
  test('still flags the plain address inside a script', () => {
    expect(findViolations('a/index.html', '<script>x="alimohsen999@gmail.com"</script>')).toHaveLength(1);
  });
  test('allows the spelled-out email', () => {
    expect(findViolations('a/index.html', '<p>alimohsen999 [at] gmail [dot] com</p>')).toEqual([]);
  });
  test('flags media on the confidential Tanami page', () => {
    expect(findViolations('work/tanami/index.html', '<img src="/x.png">')).toHaveLength(1);
    expect(findViolations('work/cuspio/index.html', '<img src="/x.png">')).toEqual([]);
  });
  test('flags the Kwaddo handle as visible text but not in attributes', () => {
    expect(findViolations('a/index.html', '<p>by Kwaddo</p>')).toHaveLength(1);
    expect(findViolations('a/index.html', '<a href="https://kwaddo.github.io/">x</a>')).toEqual([]);
  });
  test('flags Quad anywhere', () => {
    expect(findViolations('a/index.html', '<p>Quad</p>')).toHaveLength(1);
  });
});
