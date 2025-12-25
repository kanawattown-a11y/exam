'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    FileSpreadsheet,
    Settings,
    Upload,
    LogOut,
    Menu,
    X,
    GraduationCap,
    ChevronLeft,
    BookOpen,
    Layers,
} from 'lucide-react';
import { isAuthenticated, logout, getCurrentAdmin } from '@/lib/auth';

interface SidebarItem {
    id: string;
    label: string;
    icon: ReactNode;
    href: string;
}

const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" />, href: '/admin' },
    { id: 'results', label: 'النتائج', icon: <FileSpreadsheet className="w-5 h-5" />, href: '/admin/results' },
    { id: 'students', label: 'الطلاب', icon: <Users className="w-5 h-5" />, href: '/admin/students' },
    { id: 'subjects', label: 'المواد', icon: <BookOpen className="w-5 h-5" />, href: '/admin/subjects' },
    { id: 'sections', label: 'الأقسام', icon: <Layers className="w-5 h-5" />, href: '/admin/sections' },
    { id: 'objections', label: 'الاعتراضات', icon: <FileSpreadsheet className="w-5 h-5" />, href: '/admin/objections' },
    { id: 'upload', label: 'رفع الملفات', icon: <Upload className="w-5 h-5" />, href: '/admin/upload' },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" />, href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [adminName, setAdminName] = useState<string>('');

    // التأكد من أننا على العميل
    useEffect(() => {
        setMounted(true);
    }, []);

    // التحقق من المصادقة
    useEffect(() => {
        if (!mounted) return;

        const checkAuth = async () => {
            // تجاهل صفحة تسجيل الدخول
            if (pathname === '/admin/login') {
                setIsLoading(false);
                return;
            }

            const authenticated = await isAuthenticated();
            if (!authenticated) {
                router.push('/admin/login');
                return;
            }

            const admin = await getCurrentAdmin();
            if (admin) {
                setAdminName(admin.username);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [mounted, pathname, router]);

    // إغلاق القائمة عند تغيير الصفحة
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // تسجيل الخروج
    const handleLogout = useCallback(() => {
        logout();
        router.push('/admin/login');
    }, [router]);

    // صفحة تسجيل الدخول لا تحتاج للتخطيط
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // انتظار التحميل على العميل - نفس الـ structure كالمحتوى الرئيسي
    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex" suppressHydrationWarning>
                <aside className="hidden md:block fixed top-0 right-0 h-full w-72 bg-dark-800 border-l border-dark-700" />
                <div className="flex-1 md:mr-72">
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <div className="spinner mx-auto mb-4" />
                            <p className="text-dark-400">جاري التحقق...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* الخلفية */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* الشريط الجانبي */}
            <aside
                className={`fixed top-0 right-0 h-full w-72 bg-dark-800 border-l border-dark-700 z-50 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* الشعار */}
                    <div className="p-6 border-b border-dark-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center glow-primary">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white">جبل باشان</h2>
                                <p className="text-xs text-dark-400">لوحة التحكم</p>
                            </div>
                        </div>
                    </div>

                    {/* القائمة */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <ul className="space-y-2">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                                ? 'bg-primary text-white glow-primary'
                                                : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                                                }`}
                                        >
                                            {item.icon}
                                            <span className="font-medium">{item.label}</span>
                                            {isActive && <ChevronLeft className="w-4 h-4 mr-auto" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* معلومات المستخدم */}
                    <div className="p-4 border-t border-dark-700">
                        <div className="flex items-center gap-3 mb-4 px-4">
                            <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center">
                                <span className="text-primary font-bold">
                                    {adminName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{adminName}</p>
                                <p className="text-xs text-dark-400">مشرف</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>تسجيل الخروج</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* المحتوى الرئيسي */}
            <div className="flex-1 md:mr-72">
                {/* الشريط العلوي للموبايل */}
                <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700 md:hidden">
                    <div className="flex items-center justify-between p-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-primary" />
                            <span className="font-bold">لوحة التحكم</span>
                        </div>
                        <div className="w-10" /> {/* Spacer */}
                    </div>
                </header>

                {/* المحتوى */}
                <main className="p-4 md:p-8">
                    {children}
                </main>
            </div>

            {/* زر إغلاق القائمة الجانبية للموبايل */}
            {isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed top-4 left-4 z-50 p-2 bg-dark-700 rounded-lg md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>
            )}
        </div>
    );
}
