import { AppError } from '@lifeos/shared';
import { assertCapability, actorUserId, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { NoteRepo } from './note.repo';
import type { Note, NoteVersion } from './note.types';

export class NoteService {
	private readonly repo: NoteRepo;

	constructor(db: DbClient) {
		this.repo = new NoteRepo(db);
	}

	async create(actor: Actor, input: { title: string; bodyMd?: string }): Promise<Note> {
		assertCapability(actor, 'note:create');
		return this.repo.create({
			workspaceId: actor.workspaceId,
			createdBy: actorUserId(actor),
			...input,
		});
	}

	async update(actor: Actor, id: string, expectedVersion: number, patch: { title?: string; bodyMd?: string }): Promise<Note> {
		assertCapability(actor, 'note:update');
		const res = await this.repo.updateWithVersion(id, actor.workspaceId, expectedVersion, patch, actorUserId(actor));
		if (res === null) throw new AppError('NOTE_NOT_FOUND', 'Note not found.');
		if (res === 'CONFLICT') throw new AppError('NOTE_VERSION_CONFLICT', 'Note was modified by someone else.');
		return res;
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'note:delete');
		const ok = await this.repo.softDelete(id, actor.workspaceId);
		if (!ok) throw new AppError('NOTE_NOT_FOUND', 'Note not found.');
	}

	async listVersions(actor: Actor, noteId: string): Promise<NoteVersion[]> {
		assertCapability(actor, 'note:read-version-history');
		return this.repo.listVersions(noteId, actor.workspaceId);
	}
}
