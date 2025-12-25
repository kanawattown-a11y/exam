'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import {
    Save,
    Clock,
    Bell,
    Eye,
    EyeOff,
    Calendar,
    Loader2,
    Check,
    RefreshCw
} from 'lucide-react';
import { getSettings, updateSettings } from '@/lib/db';
import { formatArabicDateTime } from '@/lib/utils';
import type { Settings } from '@/types';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // حقول النموذج
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [countdownDate, setCountdownDate] = useState('');
    const [countdownTime, setCountdownTime] = useState('');
    const [announcementText, setAnnouncementText] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const loaded = await getSettings();
            setSettings(loaded);

            setIsResultsOpen(loaded.isResultsOpen);
            setAnnouncementText(loaded.announcementText || '');

            if (loaded.countdownEnd) {
                const date = new Date(loaded.countdownEnd);
                setCountdownDate(date.toISOString().split('T')[0]);
                setCountdownTime(date.toTimeString().slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            // تجميع التاريخ والوقت
            let countdownEnd: string | null = null;
            if (countdownDate && countdownTime) {
                countdownEnd = new Date(`${countdownDate}T${countdownTime}`).toISOString();
            }

            // حفظ الإعدادات
            await updateSettings({
                isResultsOpen,
                countdownEnd,
                announcementText: announcementText || null,
            });

            // إعادة تحميل الإعدادات
            const loaded = await getSettings();
            setSettings(loaded);
            setSaveSuccess(true);

            // إخفاء رسالة النجاح بعد 3 ثواني
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleResults = () => {
        setIsResultsOpen(!isResultsOpen);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-8 fade-in max-w-4xl">
            {/* العنوان */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                    الإعدادات
                </h1>
                <p className="text-dark-400">
                    إدارة إعدادات المؤقت وصفحة النتائج
                </p>
            </div>

            {/* حالة النتائج */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isResultsOpen ? 'bg-emerald-500/20' : 'bg-dark-600'
                        }`}>
                        {isResultsOpen ? (
                            <Eye className="w-5 h-5 text-emerald-400" />
                        ) : (
                            <EyeOff className="w-5 h-5 text-dark-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">حالة النتائج</h3>
                        <p className="text-sm text-dark-400">
                            {isResultsOpen ? 'النتائج متاحة للطلاب الآن' : 'النتائج مخفية عن الطلاب'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleToggleResults}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${isResultsOpen
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                        }`}
                >
                    {isResultsOpen ? (
                        <>
                            <EyeOff className="w-5 h-5 inline ml-2" />
                            إخفاء النتائج عن الطلاب
                        </>
                    ) : (
                        <>
                            <Eye className="w-5 h-5 inline ml-2" />
                            إظهار النتائج للطلاب
                        </>
                    )}
                </button>
            </div>

            {/* إعدادات المؤقت */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">مؤقت العد التنازلي</h3>
                        <p className="text-sm text-dark-400">
                            حدد موعد إعلان النتائج
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* التاريخ */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            <Calendar className="w-4 h-4 inline ml-2" />
                            التاريخ
                        </label>
                        <input
                            type="date"
                            value={countdownDate}
                            onChange={(e) => setCountdownDate(e.target.value)}
                            className="input"
                            dir="ltr"
                        />
                    </div>

                    {/* الوقت */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            <Clock className="w-4 h-4 inline ml-2" />
                            الوقت
                        </label>
                        <input
                            type="time"
                            value={countdownTime}
                            onChange={(e) => setCountdownTime(e.target.value)}
                            className="input"
                            dir="ltr"
                        />
                    </div>
                </div>

                {/* معاينة التاريخ */}
                {countdownDate && countdownTime && (
                    <div className="mt-4 p-4 bg-dark-700/50 rounded-xl">
                        <p className="text-dark-400 text-sm mb-1">موعد إعلان النتائج:</p>
                        <p className="text-white font-semibold">
                            {formatArabicDateTime(new Date(`${countdownDate}T${countdownTime}`))}
                        </p>
                    </div>
                )}
            </div>

            {/* نص الإعلان */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">نص الإعلان</h3>
                        <p className="text-sm text-dark-400">
                            رسالة تظهر للطلاب أثناء انتظار النتائج
                        </p>
                    </div>
                </div>

                <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="مثال: سيتم الإعلان عن النتائج قريباً..."
                    rows={3}
                    className="input resize-none"
                />
            </div>

            {/* آخر تحديث */}
            {settings && (
                <div className="text-dark-500 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    آخر تحديث: {formatArabicDateTime(settings.updatedAt)}
                </div>
            )}

            {/* زر الحفظ */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`btn ${saveSuccess ? 'btn-success' : 'btn-primary'} px-8`}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري الحفظ...
                        </>
                    ) : saveSuccess ? (
                        <>
                            <Check className="w-5 h-5" />
                            تم الحفظ بنجاح
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            حفظ الإعدادات
                        </>
                    )}
                </button>

                {saveSuccess && (
                    <span className="text-emerald-400 text-sm fade-in">
                        ✓ تم حفظ التغييرات
                    </span>
                )}
            </div>
        </div>
    );
}
