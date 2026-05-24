# ADR-0018 — Vault Crypto: XChaCha20-Poly1305 + Argon2id KDF

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

Use XChaCha20-Poly1305 (`@noble/ciphers/chacha`) for payload encryption and Argon2id (`@noble/hashes/argon2`) for master-key derivation from user password.

**Argon2id parameters (OWASP 2024 minimum):** `m=64MB, t=3, p=1, dkLen=32`

## Alternatives Rejected

- **AES-256-GCM**: 96-bit nonce risks collision in client-side long-lived scenarios.
- **PBKDF2**: Weak against GPU brute-force attacks.
- **scrypt**: Parameter passing is error-prone in browser environments.

## Consequences

- ~250ms derivation time per unlock on typical client device (acceptable UX).
- Nonce is 192-bit (XChaCha20) — collision probability negligible for client-side use.
- Envelope pattern: random per-item key wrapped by master key (key compromise isolation).

## References
- [noble/ciphers](https://github.com/paulmillr/noble-ciphers)
- [noble/hashes](https://github.com/paulmillr/noble-hashes)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
