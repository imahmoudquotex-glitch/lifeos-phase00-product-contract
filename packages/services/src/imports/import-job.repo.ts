import type { DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared';

export type ImportJob = {
	id: string;
	workspaceId: string;
	createdBy: string;
	source: string;
	status: 'queued' | 'running' | 'completed' | 'failed';
	totalRows: number;
	processedRows: number;
	errorMessage: string | null;
	startedAt: Date | null;
	finishedAt: Date | null;
	createdAt: Date;
};

type ImportJobRow = {
	id: string; workspace_id: string; created_by: string; source: string;
	status: string; total_rows: number; processed_rows: number;
	error_message: string | null; started_at: Date | null; finished_at: Date | null; created_at: Date;
};

function mapRow(r: ImportJobRow): ImportJob {
	return {
		id: r.id, workspaceId: r.workspace_id, createdBy: r.created_by,
		source: r.source, status: r.status as ImportJob['status'],
		totalRows: r.total_rows, processedRows: r.processed_rows,
		errorMessage: r.error_message, startedAt: r.started_at,
		finishedAt: r.finished_at, createdAt: r.created_at,
	};
}

const COLS = 'id, workspace_id, created_by, source, status, total_rows, processed_rows, error_message, started_at, finished_at, created_at';

export class ImportJobRepo {
	constructor(private readonly db: DbClient) {}

	async create(input: { workspaceId: string; createdBy: string; source: string }): Promise<ImportJob> {
		const id = newUlid();
		const row = await this.db.one<ImportJobRow>(
			`INSERT INTO import_jobs (id, workspace_id, created_by, source) VALUES ($1,$2,$3,$4) RETURNING ${COLS}`,
			[id, input.workspaceId, input.createdBy, input.source],
		);
		return mapRow(row);
	}

	async findById(id: string, workspaceId: string): Promise<ImportJob | null> {
		const row = await this.db.oneOrNone<ImportJobRow>(
			`SELECT ${COLS} FROM import_jobs WHERE id = $1 AND workspace_id = $2`,
			[id, workspaceId],
		);
		return row ? mapRow(row) : null;
	}
}
