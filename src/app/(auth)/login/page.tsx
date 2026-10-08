import { Suspense } from 'react';
import LoginContent from './login-content';

export const metadata = {
  title: 'Вход',
};

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-muted/20">
      <div className="h-[420px] w-full max-w-md animate-pulse rounded-xl bg-muted/40" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}