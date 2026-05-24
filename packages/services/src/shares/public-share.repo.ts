import type { DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared';
import { createHash } from 'node:crypto';

export type PublicShare = {
	id: string;
	workspaceId: string;
	resourceType: 'page' | 'note';
	resourceId: string;
	tokenHash: string;
	createdBy: string;
	expiresAt: Date | null;
	revokedAt: Date | null;
	createdAt: Date;
};

type ShareRow = {
	id: string; workspace_id: string; resource_type: string; resource_id: string;
	token_hash: string; created_by: string; expires_at: Date | null; revoked_at: Date | null; created_at: Date;
};

const COLS = 'id, workspace_id, resource_type, resource_id, token_hash, created_by, expires_at, revoked_at, created_at';

function mapRow(r: ShareRow): PublicShare {
	return {
		id: r.id, workspaceId: r.workspace_id,
		resourceType: r.resource_type as PublicShare['resourceType'],
		resourceId: r.resource_id, tokenHash: r.token_hash,
		createdBy: r.created_by, expiresAt: r.expires_at,
		revokedAt: r.revoked_at, createdAt: r.created_at,
	};
}

export class PublicShareRepo {
	constructor(private readonly db: DbClient) {}

	hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	async create(input: {
		workspaceId: string;
		resourceType: 'page' | 'note';
		resourceId: string;
		createdBy: string;
		rawToken: string;
		expiresAt?: Date;
	}): Promise<PublicShare> {
		const id = newUlid();
		const tokenHash = this.hashToken(input.rawToken);
		const row = await this.db.one<ShareRow>(
			`INSERT INTO public_shares (id, workspace_id, resource_type, resource_id, token_hash, created_by, expires_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)
			 RETURNING ${COLS}`,
			[id, input.workspaceId, input.resourceType, input.resourceId, tokenHash, input.createdBy, input.expiresAt ?? null],
		);
		return mapRow(row);
	}

	async revoke(id: string, workspaceId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE public_shares SET revoked_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND revoked_at IS NULL
			 RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}
}
