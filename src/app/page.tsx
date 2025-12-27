'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import CountdownTimer from '@/components/countdown/CountdownTimer';
import SearchForm from '@/components/search/SearchForm';
import ResultCard from '@/components/results/ResultCard';
import { getSettings, getStudentFullResult } from '@/lib/db';
import type { Settings, StudentResult } from '@/types';

type ViewState = 'loading' | 'countdown' | 'search' | 'result';

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const [viewState, setViewState] = useState<ViewState>('loading');
    const [settings, setSettings] = useState<Settings | null>(null);
    const [result, setResult] = useState<StudentResult | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // التأكد من أننا على العميل
    useEffect(() => {
        setMounted(true);
    }, []);

    // تحميل الإعدادات
    useEffect(() => {
        if (!mounted) return;

        const loadSettings = async () => {
            try {
                const loadedSettings = await getSettings();
                setSettings(loadedSettings);

                // تحديد حالة العرض حسب الإعدادات
                if (loadedSettings.isResultsOpen) {
                    setViewState('search');
                } else if (loadedSettings.countdownEnd) {
                    const endDate = new Date(loadedSettings.countdownEnd);
                    if (endDate > new Date()) {
                        setViewState('countdown');
                    } else {
                        setViewState('search');
                    }
                } else {
                    setViewState('countdown');
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                setViewState('countdown');
            }
        };

        loadSettings();
    }, [mounted]);

    // معالجة انتهاء المؤقت
    const handleCountdownExpire = useCallback(() => {
        setViewState('search');
    }, []);

    // معالجة البحث
    const handleSearch = useCallback(async (subscriptionNumber: string) => {
        setIsSearching(true);
        setSearchError(null);
        setResult(null);

        try {
            const response = await getStudentFullResult(subscriptionNumber);

            if (response.success && response.data) {
                setResult(response.data);
                setViewState('result');
            } else {
                setSearchError(response.error || 'حدث خطأ غير متوقع');
            }
        } catch (error) {
            setSearchError('حدث خطأ في الاتصال بالخادم');
        } finally {
            setIsSearching(false);
        }
    }, []);

    // العودة للبحث
    const handleBackToSearch = useCallback(() => {
        setResult(null);
        setSearchError(null);
        setViewState('search');
    }, []);

    // حالة التحميل
    if (viewState === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner mx-auto mb-4" />
                    <p className="text-dark-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen relative">
            {/* خلفية متحركة */}
            <div className="fixed inset-0 pointer-events-none">
                {/* دوائر متوهجة */}
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* المحتوى الرئيسي */}
            <div className="relative z-10 container mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-12">
                {/* الشعار والعنوان */}
                <header className="text-center mb-8 sm:mb-12 md:mb-16 fade-in">
                    {/* الأيقونة */}
                    <div className="inline-flex items-center justify-center mb-6">
                        <img
                            src="/logo.jpg"
                            alt="شعار مديرية التربية والتعليم"
                            className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-contain shadow-2xl"
                        />
                    </div>

                    {/* العنوان الرئيسي */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        <span className="gradient-text">نتائج الامتحانات</span>
                    </h1>

                    {/* العنوان الفرعي */}
                    <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-dark-400">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span>جبل باشان</span>
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>

                    {/* الإعلان */}
                    {settings?.announcementText && viewState === 'countdown' && (
                        <div className="mt-6 inline-block glass rounded-full px-6 py-2 text-dark-300">
                            {settings.announcementText}
                        </div>
                    )}
                </header>

                {/* المحتوى الرئيسي حسب الحالة */}
                <div className="max-w-5xl mx-auto">
                    {/* حالة المؤقت */}
                    {viewState === 'countdown' && settings?.countdownEnd && (
                        <div className="slide-up">
                            <CountdownTimer
                                targetDate={settings.countdownEnd}
                                onExpire={handleCountdownExpire}
                            />
                        </div>
                    )}

                    {/* حالة البحث */}
                    {viewState === 'search' && (
                        <div className="slide-up">
                            <SearchForm
                                onSearch={handleSearch}
                                isLoading={isSearching}
                                error={searchError}
                            />
                        </div>
                    )}

                    {/* حالة عرض النتيجة */}
                    {viewState === 'result' && result && (
                        <div className="slide-up">
                            {/* زر العودة */}
                            <button
                                onClick={handleBackToSearch}
                                className="flex items-center gap-2 text-dark-400 hover:text-primary transition-colors mb-6 group"
                            >
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                <span>العودة للبحث</span>
                            </button>

                            <ResultCard result={result} />
                        </div>
                    )}
                </div>

                {/* التذييل */}
                <footer className="mt-16 text-center text-dark-500 text-sm">
                    <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - جبل باشان</p>
                </footer>
            </div>
        </main>
    );
}
