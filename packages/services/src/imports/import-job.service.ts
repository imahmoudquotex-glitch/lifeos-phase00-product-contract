import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { ImportJobRepo, type ImportJob } from './import-job.repo';

export class ImportJobService {
	private readonly repo: ImportJobRepo;

	constructor(db: DbClient) {
		this.repo = new ImportJobRepo(db);
	}

	async start(actor: Actor, source: string): Promise<ImportJob> {
		assertCapability(actor, 'import:start');
		return this.repo.create({ workspaceId: actor.workspaceId, createdBy: actor.userId, source });
	}

	async getById(actor: Actor, id: string): Promise<ImportJob> {
		assertCapability(actor, 'import:read');
		const job = await this.repo.findById(id, actor.workspaceId);
		if (!job) throw new AppError('IMPORT_JOB_NOT_FOUND', 'Import job not found.');
		return job;
	}
}
