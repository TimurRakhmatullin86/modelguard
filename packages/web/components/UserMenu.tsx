'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('github')}
        className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">{session.user?.name ?? session.user?.email}</span>
      {session.user?.image && (
        <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
      )}
      <button
        onClick={() => signOut()}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  );
}
