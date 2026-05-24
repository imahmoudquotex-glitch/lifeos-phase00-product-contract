import { consoleLogger } from '@lifeos/shared';

const log = consoleLogger;

/**
 * Phase 04: Outbox consumer boot.
 * Full LLM dispatch and dead-letter handling wired in Phase 05.
 * See: docs/execution/phase-04-decisions-log.md → D-058
 */

async function processOutbox(): Promise<void> {
  // Phase 05: query outbox table with FOR UPDATE SKIP LOCKED,
  // dispatch to AI services via @lifeos/services, move failures to outbox_dead_letter.
  log.info('worker_outbox_tick', { status: 'no-op', phase: '04', deferred_to: '05' });
}

async function main(): Promise<void> {
  log.info('worker_boot', { phase: '04', status: 'ready' });

  // Phase 04: graceful shutdown registered — real job loop in Phase 05
  const shutdown = (signal: string): void => {
    log.info('worker_shutdown', { signal });
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Single outbox tick to confirm the worker can connect
  await processOutbox();

  // Phase 04: exit cleanly after boot (Phase 05 adds the poll loop)
  process.exitCode = 0;
}

main().catch((err: unknown) => {
  log.error('worker_fatal', { err });
  process.exitCode = 1;
});
