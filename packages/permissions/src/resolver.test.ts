import { describe, expect, it } from 'vitest';
import { hasCapability, CAPABILITIES } from './resolver';

describe('permissions resolver', () => {
  it('admin has PAGE_CREATE', () => {
    expect(hasCapability('admin', CAPABILITIES.PAGE_CREATE)).toBe(true);
  });
  it('viewer lacks PAGE_CREATE', () => {
    expect(hasCapability('viewer', CAPABILITIES.PAGE_CREATE)).toBe(false);
  });
});
