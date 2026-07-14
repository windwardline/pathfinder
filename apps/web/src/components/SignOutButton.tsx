import { signOut } from '@/auth';

export function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/signin' });
      }}
    >
      <button
        type="submit"
        className="mt-1 text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
