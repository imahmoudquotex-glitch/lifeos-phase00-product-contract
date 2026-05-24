# 0005: Session Storage

## Context
We need to manage user sessions securely.

## Decision
We use server-side sessions stored in the database instead of JWTs to allow trivial revocation, avoid token-in-localStorage vulnerabilities, and capture IP/UA for auditing.
