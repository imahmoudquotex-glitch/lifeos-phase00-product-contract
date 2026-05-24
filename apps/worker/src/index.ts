import { consoleLogger } from '@lifeos/shared';

const log = consoleLogger;

log.info('worker_boot', { phase: '01', status: 'placeholder' });

// Phase 04: job queue consumer will be registered here.
// Phase 01: graceful exit after boot log.
process.exitCode = 0;
