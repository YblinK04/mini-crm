'use client';

import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

type LoginFormValues = z.input<typeof LoginSchema>;

export default function LoginContent() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const form = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          toast.error('Неверный email или пароль');
        } else {
          console.error('[login] signIn error:', result.error);
          toast.error('Не удалось войти. Попробуйте позже');
        }
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error: unknown) {
      console.error('[login] unexpected error:', error);
      toast.error('Произошла ошибка при входе');
    }
  };

  const emailError = form.formState.errors.email;
  const passwordError = form.formState.errors.password;

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-none ring-1 ring-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Вход в систему
          </CardTitle>
          <CardDescription>
            Введите email и пароль, чтобы продолжить.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                {...form.register('email')}
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                autoFocus
                disabled={isLoading}
                className="bg-background"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-xs text-destructive">
                  {emailError.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  {...form.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="bg-background pr-10"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={
                    passwordError ? 'password-error' : undefined
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  aria-label={
                    showPassword ? 'Скрыть пароль' : 'Показать пароль'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-xs text-destructive">
                  {passwordError.message}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                {...form.register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                disabled={isLoading}
                className="h-4 w-4 cursor-pointer rounded border-input accent-primary disabled:opacity-50"
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer select-none text-xs font-medium text-muted-foreground"
              >
                Запомнить меня
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-center gap-1.5 border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Нет аккаунта?
          </span>
          <Link
            href="/register"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Зарегистрироваться
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}