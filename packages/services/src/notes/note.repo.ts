import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { Note, NoteVersion } from './note.types';

type NoteRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	body_md: string;
	version: number;
	created_at: Date;
	updated_at: Date;
};

type NoteVersionRow = {
	id: string;
	note_id: string;
	workspace_id: string;
	version: number;
	title: string;
	body_md: string;
	edited_by: string;
	created_at: Date;
};

export class NoteRepo extends BaseRepo<Note, NoteRow> {
	protected readonly table = 'notes';
	protected readonly columns = [
		'id', 'workspace_id', 'created_by', 'title', 'body_md', 'version', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: NoteRow): Note {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			title: r.title,
			bodyMd: r.body_md,
			version: r.version,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async create(input: {
		workspaceId: string;
		createdBy: string;
		title: string;
		bodyMd?: string;
	}): Promise<Note> {
		const id = newUlid();
		const row = await this.db.one<NoteRow>(
			`INSERT INTO notes (id, workspace_id, created_by, title, body_md)
			 VALUES ($1,$2,$3,$4,$5)
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.createdBy, input.title, input.bodyMd ?? ''],
		);
		return this.mapRow(row);
	}

	async updateWithVersion(
		id: string,
		workspaceId: string,
		expectedVersion: number,
		patch: { title?: string; bodyMd?: string },
		editedBy: string,
	): Promise<Note | 'CONFLICT' | null> {
		return this.db.tx(async (tx) => {
			const row = await tx.oneOrNone<NoteRow>(
				`UPDATE notes SET
				  title = COALESCE($4, title),
				  body_md = COALESCE($5, body_md),
				  version = version + 1,
				  updated_at = now()
				 WHERE id = $1 AND workspace_id = $2 AND version = $3 AND is_deleted = false
				 RETURNING ${this.selectList()}`,
				[id, workspaceId, expectedVersion, patch.title ?? null, patch.bodyMd ?? null],
			);
			if (!row) {
				const exists = await tx.oneOrNone<{ version: number }>(
					`SELECT version FROM notes WHERE id = $1 AND workspace_id = $2 AND is_deleted = false`,
					[id, workspaceId],
				);
				return exists ? 'CONFLICT' : null;
			}
			await tx.none(
				`INSERT INTO note_versions (id, note_id, workspace_id, version, title, body_md, edited_by)
				 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[newUlid(), row.id, row.workspace_id, row.version, row.title, row.body_md, editedBy],
			);
			return this.mapRow(row);
		});
	}

	async softDelete(id: string, workspaceId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE notes SET is_deleted = true, updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}

	private mapVersionRow(r: NoteVersionRow): NoteVersion {
		return {
			id: r.id,
			noteId: r.note_id,
			workspaceId: r.workspace_id,
			version: r.version,
			title: r.title,
			bodyMd: r.body_md,
			editedBy: r.edited_by,
			createdAt: r.created_at,
		};
	}

	async listVersions(noteId: string, workspaceId: string): Promise<NoteVersion[]> {
		const rows = await this.db.many<NoteVersionRow>(
			`SELECT id, note_id, workspace_id, version, title, body_md, edited_by, created_at
			 FROM note_versions
			 WHERE note_id = $1 AND workspace_id = $2
			 ORDER BY version DESC`,
			[noteId, workspaceId],
		);
		return rows.map((r: NoteVersionRow) => this.mapVersionRow(r));
	}
}
