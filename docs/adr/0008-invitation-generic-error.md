# 0008: Invitation Generic Error

## Context
When an invitation is invalid, we might leak the existence of a workspace or email if we return specific errors.

## Decision
Return a generic "Invitation link is invalid or has expired." error for all failure modes to prevent enumeration.
