'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { CreatedUserSchema, type CreateUserInput } from '@/lib/schemas';
import { api } from '@/lib/react-query';
import { HttpError } from '@/lib/react-query'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';

interface ApiValidationError {
  error: string;
  details?: Record<string, string[]>;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreatedUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '', 
    },
  });

  const { errors } = form.formState;

  const onSubmit = async (data: CreateUserInput) => {
    setIsLoading(true);
    try {
      await api.post('/api/register', data);  
      
      toast.success('Аккаунт успешно создан!', {
        description: 'Теперь вы можете войти в систему.',
      });
      
      router.push('/login');
    } catch (error: unknown) {
  console.error('REGISTER_SUBMIT_ERROR:', error);
  
  if (error instanceof HttpError) {
    try {
      const serverError = JSON.parse(error.message) as ApiValidationError;
      
      if (serverError.details) {
        Object.entries(serverError.details).forEach(([key, messages]) => {
          if (Array.isArray(messages) && messages[0]) {
            form.setError(key as keyof CreateUserInput, {
              type: 'server',
              message: messages[0], 
            });
          }
        });
        toast.error('Проверьте правильность заполнения полей');
        return;
      }
      
      toast.error(serverError.error || 'Ошибка при регистрации');
      return;
    } catch {
      toast.error(error.message);
      return;
    }
  }

  const message = error instanceof Error ? error.message : 'Ошибка при регистрации';
  toast.error(message);
}
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-xl border-none ring-1 ring-border">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Создать аккаунт</CardTitle>
          <CardDescription>
            Заполните данные, чтобы начать работу в RealTask
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           
            <div className="space-y-2">
              <Label htmlFor="name">Ваше имя</Label>
              <Input
                {...form.register('name')}
                id="name"
                placeholder="Александр"
                disabled={isLoading}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p role="alert" className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...form.register('email')}
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  {...form.register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <div className="relative">
                <Input
                  {...form.register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={!!errors.confirmPassword}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание аккаунта...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t pt-6">
          <span className="text-sm text-muted-foreground">Уже есть аккаунт?</span>
          <Link 
            href="/login" 
            className="text-sm font-semibold text-primary hover:underline underline-offset-4"
          >
            Войти
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
