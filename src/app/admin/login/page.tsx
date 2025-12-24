'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2, GraduationCap } from 'lucide-react';
import { login, initializeAdmin } from '@/lib/auth';

export default function AdminLoginPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        initializeAdmin();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            setError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await login(username, password);

            if (result.success) {
                router.push('/admin');
            } else {
                setError(result.error || 'حدث خطأ غير متوقع');
            }
        } catch {
            setError('حدث خطأ في الاتصال');
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* خلفية متحركة */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* بطاقة تسجيل الدخول */}
                <div className="glass-strong rounded-3xl p-6 sm:p-8 fade-in">
                    {/* الشعار */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark mb-4 glow-primary">
                            <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold gradient-text mb-2">
                            لوحة التحكم
                        </h1>
                        <p className="text-dark-400 text-sm">
                            تسجيل دخول المشرفين
                        </p>
                    </div>

                    {/* النموذج */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* اسم المستخدم */}
                        <div>
                            <label className="block text-dark-300 text-sm font-medium mb-2">
                                اسم المستخدم
                            </label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="أدخل اسم المستخدم"
                                    disabled={isLoading}
                                    className="input pr-12 w-full"
                                    autoComplete="username"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* كلمة المرور */}
                        <div>
                            <label className="block text-dark-300 text-sm font-medium mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="أدخل كلمة المرور"
                                    disabled={isLoading}
                                    className="input pr-12 w-full"
                                    autoComplete="current-password"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        {/* رسالة الخطأ */}
                        {error && (
                            <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center text-sm fade-in">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* زر تسجيل الدخول */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full py-3 sm:py-4 text-base sm:text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    جاري تسجيل الدخول...
                                </>
                            ) : (
                                'تسجيل الدخول'
                            )}
                        </button>
                    </form>

                    {/* ملاحظة */}
                    <div className="mt-5 text-center text-dark-500 text-xs">
                        <p>بيانات الدخول الافتراضية:</p>
                        <p className="font-mono mt-1" dir="ltr">admin / admin123</p>
                    </div>
                </div>

                {/* رابط العودة */}
                <div className="text-center mt-4 sm:mt-6">
                    <a
                        href="/"
                        className="text-dark-400 hover:text-primary transition-colors text-sm"
                    >
                        العودة للصفحة الرئيسية
                    </a>
                </div>
            </div>
        </main>
    );
}
