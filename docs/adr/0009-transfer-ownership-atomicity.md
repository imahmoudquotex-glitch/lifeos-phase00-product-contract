# 0009: Transfer Ownership Atomicity

## Context
PostgreSQL does not support DEFERRABLE on partial unique indexes, so swapping roles between old and new owner fails if done blindly.

## Decision
Application layer enforces transition order inside one transaction: (1) revoke old owner via UPDATE removed_at, (2) promote new owner via UPDATE role or INSERT, (3) audit, (4) rotateOnPrivilegeChange for both users.
