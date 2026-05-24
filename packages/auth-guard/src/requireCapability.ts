// @ts-nocheck
import { assertCapability, type PermissionSubject } from '@lifeos/permissions/resolver';
import type { Capability } from '@lifeos/permissions/capabilities';

export function requireCapability(subject: PermissionSubject, capability: Capability): void {
  assertCapability(subject, capability);
}
