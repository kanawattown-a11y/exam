'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    FileSpreadsheet,
    Clock,
    TrendingUp,
    CheckCircle,
    XCircle,
    Calendar,
    Activity
} from 'lucide-react';
import { getSettings, getStudents, getResults, getCertificateTypes, getSections, getSubjects } from '@/lib/db';
import { formatArabicNumber, formatArabicDateTime } from '@/lib/utils';

interface DashboardStats {
    totalStudents: number;
    totalResults: number;
    passedStudents: number;
    failedStudents: number;
    averageScore: number;
    certificateTypes: number;
    sections: number;
    isResultsOpen: boolean;
    countdownEnd: string | null;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();

        // تحديث تلقائي كل 5 ثواني
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const [settings, students, results, certificateTypes, sections, subjects] = await Promise.all([
                getSettings(),
                getStudents(),
                getResults(),
                getCertificateTypes(),
                getSections(),
                getSubjects(),
            ]);

            // إنشاء map للدرجات العظمى والدنيا للمواد
            const subjectData = new Map<number, { maxGrade: number; minGrade: number }>();
            subjects.forEach(s => subjectData.set(s.id, {
                maxGrade: s.maxGrade,
                minGrade: s.minGrade || Math.floor(s.maxGrade * 0.5)
            }));

            // حساب الإحصائيات - تجميع نتائج كل طالب
            const studentResultsMap = new Map<number, { total: number; max: number; hasFailedSubject: boolean }>();

            results.forEach(r => {
                if (!studentResultsMap.has(r.studentId)) {
                    studentResultsMap.set(r.studentId, { total: 0, max: 0, hasFailedSubject: false });
                }
                const current = studentResultsMap.get(r.studentId)!;
                current.total += r.grade;

                const subject = subjectData.get(r.subjectId);
                const maxGrade = subject?.maxGrade || 100;
                const minGrade = subject?.minGrade || 50;
                current.max += maxGrade;

                // التحقق من الرسوب في المادة
                if (r.grade < minGrade) {
                    current.hasFailedSubject = true;
                }
            });

            let passedStudents = 0;
            let failedStudents = 0;
            let totalPercentage = 0;
            let scoredStudents = 0;

            // إنشاء map للطلاب للتحقق من الرسوب اليدوي
            const studentsMap = new Map(students.map(s => [s.id, s]));

            studentResultsMap.forEach(({ total, max, hasFailedSubject }, studentId) => {
                const student = studentsMap.get(studentId);
                if (max > 0) {
                    const percentage = (total / max) * 100;
                    totalPercentage += percentage;
                    scoredStudents++;

                    // الطالب راسب إذا:
                    // 1. لديه رسوب يدوي
                    // 2. أو لديه مادة أقل من الدرجة الدنيا
                    // 3. أو نسبته أقل من 50%
                    if (student?.manualFail || hasFailedSubject || percentage < 50) {
                        failedStudents++;
                    } else {
                        passedStudents++;
                    }
                }
            });

            // المعدل العام = متوسط النسب المئوية لجميع الطلاب
            const averageScore = scoredStudents > 0 ? totalPercentage / scoredStudents : 0;

            setStats({
                totalStudents: students.length,
                totalResults: results.length,
                passedStudents,
                failedStudents,
                averageScore,
                certificateTypes: certificateTypes.length,
                sections: sections.length,
                isResultsOpen: settings.isResultsOpen,
                countdownEnd: settings.countdownEnd,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'إجمالي الطلاب',
            value: stats?.totalStudents || 0,
            icon: <Users className="w-6 h-6" />,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400',
        },
        {
            label: 'إجمالي النتائج',
            value: stats?.totalResults || 0,
            icon: <FileSpreadsheet className="w-6 h-6" />,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-400',
        },
        {
            label: 'الناجحون',
            value: stats?.passedStudents || 0,
            icon: <CheckCircle className="w-6 h-6" />,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
        },
        {
            label: 'الراسبون',
            value: stats?.failedStudents || 0,
            icon: <XCircle className="w-6 h-6" />,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
        },
    ];

    return (
        <div className="space-y-8 fade-in">
            {/* العنوان */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                    لوحة التحكم
                </h1>
                <p className="text-dark-400">
                    مرحباً بك في لوحة تحكم نتائج الامتحانات
                </p>
            </div>

            {/* حالة النظام */}
            <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats?.isResultsOpen ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        }`}>
                        <Activity className={`w-6 h-6 ${stats?.isResultsOpen ? 'text-emerald-400' : 'text-amber-400'
                            }`} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">حالة النتائج</h3>
                        <p className={`text-sm ${stats?.isResultsOpen ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                            {stats?.isResultsOpen ? 'النتائج متاحة للعرض' : 'النتائج غير متاحة بعد'}
                        </p>
                    </div>
                </div>

                {stats?.countdownEnd && (
                    <div className="flex items-center gap-3 text-dark-400">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm">
                            موعد الإعلان: {formatArabicDateTime(stats.countdownEnd)}
                        </span>
                    </div>
                )}
            </div>

            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={card.label}
                        className="card hover:scale-105 transition-transform duration-300 fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                                <span className={card.textColor}>{card.icon}</span>
                            </div>
                            <TrendingUp className="w-5 h-5 text-dark-500" />
                        </div>
                        <div>
                            <p className="text-dark-400 text-sm mb-1">{card.label}</p>
                            <p className="text-2xl md:text-3xl font-bold text-white">
                                {formatArabicNumber(card.value)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* إحصائيات إضافية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المعدل العام */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-white">المعدل العام</h3>
                    </div>

                    <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-2">
                            {stats?.averageScore.toFixed(1) || '0'}%
                        </div>
                        <p className="text-dark-400">متوسط درجات جميع الطلاب</p>
                    </div>

                    {/* شريط التقدم */}
                    <div className="mt-6">
                        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-l from-primary to-primary-light transition-all duration-1000"
                                style={{ width: `${stats?.averageScore || 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* نسبة النجاح */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="font-semibold text-white">نسبة النجاح</h3>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                        {/* دائرة النسبة */}
                        <div className="relative w-32 h-32">
                            <svg className="progress-ring w-full h-full" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-dark-700"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    className="progress-ring-circle"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - ((stats?.passedStudents || 0) / Math.max(1, (stats?.passedStudents || 0) + (stats?.failedStudents || 0))))}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-emerald-400">
                                    {stats && (stats.passedStudents + stats.failedStudents) > 0
                                        ? ((stats.passedStudents / (stats.passedStudents + stats.failedStudents)) * 100).toFixed(0)
                                        : 0}%
                                </span>
                            </div>
                        </div>

                        {/* الأرقام */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <span className="text-dark-300">ناجح:</span>
                                <span className="font-bold text-white">{formatArabicNumber(stats?.passedStudents || 0)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <span className="text-dark-300">راسب:</span>
                                <span className="font-bold text-white">{formatArabicNumber(stats?.failedStudents || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* روابط سريعة */}
            <div className="card">
                <h3 className="font-semibold text-white mb-4">إجراءات سريعة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/admin/upload" className="btn btn-secondary justify-center">
                        <Clock className="w-5 h-5" />
                        رفع ملف
                    </a>
                    <a href="/admin/students" className="btn btn-secondary justify-center">
                        <Users className="w-5 h-5" />
                        إضافة طالب
                    </a>
                    <a href="/admin/results" className="btn btn-secondary justify-center">
                        <FileSpreadsheet className="w-5 h-5" />
                        إدارة النتائج
                    </a>
                    <a href="/admin/settings" className="btn btn-secondary justify-center">
                        <Clock className="w-5 h-5" />
                        إعدادات المؤقت
                    </a>
                </div>
            </div>
        </div>
    );
}
