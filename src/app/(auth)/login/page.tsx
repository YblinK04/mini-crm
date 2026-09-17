'use client';

import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type LoginInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react'; 

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const router = useRouter();

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: { 
        email: '', 
        password: '',
        rememberMe: false 
    }
});

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                rememberMe: data.rememberMe, 
                redirect: false,
            });

            if (result?.error) {
                toast.error('Неверный логин или пароль');
                return;
            }

            toast.success('Успешный вход');
            router.push('/dashboard');
            router.refresh();
        } catch (error: unknown) { 
            console.error('LOGIN_ERROR:', error);
            toast.error('Произошла ошибка при входе');
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center px-4 bg-muted/20">
            <Card className="w-full max-w-md shadow-lg border-none ring-1 ring-border">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold font-sans">С возвращением</CardTitle>
                    <CardDescription>Введите данные для входа в RealTask</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Input 
                                {...form.register('email')} 
                                type="email" 
                                placeholder="name@example.com" 
                                disabled={isLoading}
                                className="bg-background"
                            />
                            {form.formState.errors.email && (
                                <p className="text-[10px] font-bold text-red-500 uppercase">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="relative">
                                <Input 
                                    {...form.register('password')} 
                                    type={showPassword ? 'text' : 'password'} 
                                    placeholder="••••••••" 
                                    disabled={isLoading}
                                    className="bg-background pr-10" 
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
                            {form.formState.errors.password && (
                                <p className="text-[10px] font-bold text-red-500 uppercase">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 py-1">
                            <input
                                {...form.register('rememberMe')}
                                type="checkbox"
                                id="rememberMe"
                                disabled={isLoading}
                                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring accent-primary cursor-pointer disabled:opacity-50"
                            />
                            <label
                                htmlFor="rememberMe"
                                className="text-xs font-bold uppercase tracking-tight text-muted-foreground cursor-pointer select-none"
                            >
                                Запомнить меня
                            </label>
                        </div>

                        <Button type="submit" className="w-full font-bold uppercase text-xs tracking-widest" disabled={isLoading}>
                            {isLoading ? 'Вход...' : 'Войти'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t pt-4">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Нет аккаунта?</span>
                    <Link href="/register" className="text-xs font-black text-primary hover:underline uppercase tracking-tight">
                        Зарегистрироваться
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
