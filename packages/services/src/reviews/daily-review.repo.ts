import type { DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared';

export type DailyReview = {
	id: string;
	workspaceId: string;
	userId: string;
	reviewDate: string;
	mood: number | null;
	summaryMd: string | null;
	createdAt: Date;
};

export class DailyReviewRepo {
	constructor(private readonly db: DbClient) {}

	async upsert(input: {
		workspaceId: string;
		userId: string;
		reviewDate: string;
		mood?: number;
		summaryMd?: string;
	}): Promise<DailyReview> {
		const id = newUlid();
		const row = await this.db.one<{
			id: string; workspace_id: string; user_id: string;
			review_date: string; mood: number | null; summary_md: string | null; created_at: Date;
		}>(
			`INSERT INTO daily_reviews (id, workspace_id, user_id, review_date, mood, summary_md)
			 VALUES ($1,$2,$3,$4::date,$5,$6)
			 ON CONFLICT (user_id, review_date) DO UPDATE
			   SET mood = COALESCE(EXCLUDED.mood, daily_reviews.mood),
			       summary_md = COALESCE(EXCLUDED.summary_md, daily_reviews.summary_md)
			 RETURNING id, workspace_id, user_id, review_date::text, mood, summary_md, created_at`,
			[id, input.workspaceId, input.userId, input.reviewDate, input.mood ?? null, input.summaryMd ?? null],
		);
		return {
			id: row.id,
			workspaceId: row.workspace_id,
			userId: row.user_id,
			reviewDate: row.review_date,
			mood: row.mood,
			summaryMd: row.summary_md,
			createdAt: row.created_at,
		};
	}
}
