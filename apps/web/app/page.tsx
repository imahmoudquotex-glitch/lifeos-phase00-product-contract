import { redirect } from 'next/navigation';

/**
 * Root page — redirects to sign-in.
 * After auth, middleware redirects to /{workspaceSlug}.
 */
export default function RootPage() {
  redirect('/signin');
}
