import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Sign In — LifeOS',
	description: 'Sign in to your LifeOS workspace.',
};

export { default } from '../../../app/auth/signin/_page';
