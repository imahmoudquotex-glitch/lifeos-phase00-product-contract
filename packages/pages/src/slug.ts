// @ts-nocheck
export function generatePageSlug(title: string): string { return title.toLowerCase().replace(/[^a-z0-9]/g, '-'); }
