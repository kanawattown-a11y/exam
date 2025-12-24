'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTimeDifference } from '@/lib/utils';

interface CountdownTimerProps {
    targetDate: string | Date;
    onExpire?: () => void;
}

interface TimeUnit {
    value: number;
    label: string;
    key: string;
}

export default function CountdownTimer({ targetDate, onExpire }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(() => getTimeDifference(targetDate));
    const [mounted, setMounted] = useState(false);

    const updateTimer = useCallback(() => {
        const newTime = getTimeDifference(targetDate);
        setTimeLeft(newTime);

        if (newTime.isExpired && onExpire) {
            onExpire();
        }
    }, [targetDate, onExpire]);

    useEffect(() => {
        setMounted(true);
        updateTimer();

        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [updateTimer]);

    if (!mounted) {
        return <CountdownSkeleton />;
    }

    if (timeLeft.isExpired) {
        return (
            <div className="text-center fade-in">
                <div className="text-2xl md:text-4xl font-bold text-emerald-400 mb-4">
                    ✨ النتائج متاحة الآن ✨
                </div>
                <p className="text-dark-400 text-lg">
                    يمكنك البحث عن نتيجتك باستخدام رقم الاكتتاب
                </p>
            </div>
        );
    }

    const timeUnits: TimeUnit[] = [
        { value: timeLeft.days, label: 'يوم', key: 'days' },
        { value: timeLeft.hours, label: 'ساعة', key: 'hours' },
        { value: timeLeft.minutes, label: 'دقيقة', key: 'minutes' },
        { value: timeLeft.seconds, label: 'ثانية', key: 'seconds' },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            {/* العنوان */}
            <div className="text-center mb-8 md:mb-12">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-dark-300 mb-2">
                    موعد إعلان النتائج
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary-light mx-auto rounded-full" />
            </div>

            {/* أرقام العد التنازلي */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
                {timeUnits.map((unit, index) => (
                    <div
                        key={unit.key}
                        className="countdown-digit group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* البطاقة */}
                        <div className="relative glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 group-hover:scale-105 pulse-glow">
                            {/* الخلفية المتوهجة */}
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-xl sm:rounded-2xl" />

                            {/* الرقم */}
                            <div className="relative">
                                <span className="countdown-value block text-center">
                                    {String(unit.value).padStart(2, '0')}
                                </span>
                            </div>

                            {/* خط فاصل */}
                            <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        </div>

                        {/* التسمية */}
                        <span className="countdown-label block text-center mt-2 sm:mt-3">
                            {unit.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* النقاط المتحركة بين الأرقام */}
            <div className="hidden md:flex justify-center items-center gap-4 mt-8">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-2">
                        <span
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                        <span
                            className="w-2 h-2 rounded-full bg-primary animate-pulse"
                            style={{ animationDelay: `${i * 200 + 100}ms` }}
                        />
                    </div>
                ))}
            </div>

            {/* شريط التقدم */}
            <div className="mt-8 md:mt-12">
                <div className="glass rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out"
                        style={{
                            width: `${Math.max(0, 100 - (timeLeft.totalMs / (7 * 24 * 60 * 60 * 1000)) * 100)}%`
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function CountdownSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 animate-pulse">
            <div className="text-center mb-12">
                <div className="h-8 bg-dark-700 rounded w-48 mx-auto mb-2" />
                <div className="h-1 w-24 bg-dark-700 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-4 gap-4 md:gap-8">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                        <div className="glass rounded-2xl p-6 md:p-8">
                            <div className="h-16 md:h-24 bg-dark-700 rounded" />
                        </div>
                        <div className="h-4 bg-dark-700 rounded w-12 mx-auto mt-3" />
                    </div>
                ))}
            </div>
        </div>
    );
}
