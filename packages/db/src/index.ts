// Phase 01 contract: export only the interface and the factory.
// Do NOT export a global singleton — services must receive DbClient via DI.
export * from './client';
export * from './postgres-adapter';
export * from './tx-context';
// NOTE: './db' (singleton) intentionally NOT exported. Use getDb(databaseUrl) instead.
