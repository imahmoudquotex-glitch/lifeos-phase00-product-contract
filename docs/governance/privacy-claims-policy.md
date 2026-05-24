# Privacy Claims Policy

## Rule
Never claim privacy/security unless implementation exists AND a test exists.

## Forbidden Claims Until Implemented
- "Zero-knowledge" without client-side encryption + test.
- "AI cannot see data" without AI gateway guard + test.
- "No logs contain sensitive data" without redaction tests.
- "Secure by default" without CI security checks.

## Required Label for Unimplemented Claims
CLAIM_NOT_ALLOWED_YET

## Glossary
- ZKE = Zero-Knowledge Encryption (data encrypted client-side; server cannot read). ✅ What LifeOS implements.
- ZKP = Zero-Knowledge Proofs (cryptographic proofs). ❌ NOT what LifeOS does. Never write "ZKP" in product copy.
