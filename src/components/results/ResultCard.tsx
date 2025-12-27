'use client';

import { useRef, useState } from 'react';
import { Download, Share2, Loader2, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { StudentResult } from '@/types';
import { formatArabicNumber, formatPercentage, getGradeColor, getGradeLabel } from '@/lib/utils';
import { createDownloadUrl } from '@/lib/utils';

interface ResultCardProps {
    result: StudentResult;
}

export default function ResultCard({ result }: ResultCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

    const { student, results: subjectResults, totalGrade, maxTotalGrade, percentage, passed } = result;

    const handleExport = async () => {
        if (!cardRef.current || isExporting) return;

        setIsExporting(true);
        setExportSuccess(false);

        try {
            const element = cardRef.current;

            // حفظ الحالة الأصلية
            const originalOverflow = element.style.overflow;
            const originalMaxHeight = element.style.maxHeight;

            // إزالة أي قيود على الارتفاع والتمرير مؤقتاً
            element.style.overflow = 'visible';
            element.style.maxHeight = 'none';

            // الانتظار لضمان اكتمال الـ render
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(element, {
                quality: 1,
                pixelRatio: 3,
                backgroundColor: '#0f172a',
                cacheBust: true,
                width: element.scrollWidth,
                height: element.scrollHeight,
                style: {
                    transform: 'scale(1)',
                    margin: '0',
                    padding: '0',
                },
            });

            // إعادة الحالة الأصلية
            element.style.overflow = originalOverflow;
            element.style.maxHeight = originalMaxHeight;

            // تحويل Base64 إلى Blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            // تحميل الصورة
            const filename = `نتيجة_${student.subscriptionNumber}_${student.fullName.replace(/\s/g, '_')}.png`;
            createDownloadUrl(blob, filename);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error('Error exporting result:', error);
            alert('حدث خطأ أثناء تصدير النتيجة');
        } finally {
            setIsExporting(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `نتيجة ${student.fullName}`,
                    text: `حصل الطالب ${student.fullName} على مجموع ${totalGrade} من ${maxTotalGrade} بنسبة ${percentage.toFixed(2)}%`,
                });
            } catch (error) {
                // المستخدم ألغى المشاركة
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 fade-in">
            {/* بطاقة النتيجة */}
            <div
                ref={cardRef}
                className="result-card glass-strong rounded-3xl overflow-hidden"
            >
                {/* رأس البطاقة */}
                <div className="relative bg-gradient-to-l from-primary/30 via-primary/20 to-transparent p-6 md:p-8">
                    {/* الشعار والعنوان */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                                نتائج الامتحانات
                            </h1>
                            <p className="text-dark-400 text-sm md:text-base">
                                {student.certificateType?.name || 'الشهادة الثانوية العامة'} - {student.certificateType?.year || '2024-2025'}
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <img
                                src="/logo.jpg"
                                alt="شعار مديرية التربية والتعليم"
                                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-contain"
                            />
                        </div>
                    </div>

                    {/* معلومات الطالب */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-dark-400 text-sm w-24">الاسم الكامل:</span>
                                <span className="text-white font-semibold text-lg">{student.fullName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-dark-400 text-sm w-24">رقم الاكتتاب:</span>
                                <span className="text-white font-mono text-lg" dir="ltr">{student.subscriptionNumber}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-dark-400 text-sm w-24">القسم:</span>
                                <span className="text-white font-semibold">{student.section?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-dark-400 text-sm w-24">الحالة:</span>
                                <span className={`badge ${passed ? 'badge-success' : 'badge-error'}`}>
                                    {passed ? '✓ ناجح' : '✗ راسب'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول النتائج */}
                <div className="p-6 md:p-8">
                    <h3 className="text-lg font-bold mb-4 text-primary">تفاصيل الدرجات</h3>

                    <div className="overflow-x-auto">
                        <table className="table-modern w-full">
                            <thead>
                                <tr>
                                    <th className="rounded-tr-xl">المادة</th>
                                    <th>الدرجة</th>
                                    <th>من</th>
                                    <th>النسبة</th>
                                    <th className="rounded-tl-xl">التقدير</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectResults.map((subjectResult, index) => (
                                    <tr
                                        key={subjectResult.subject.id}
                                        className="fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="font-medium">{subjectResult.subject.name}</td>
                                        <td className="font-bold text-white">
                                            {formatArabicNumber(subjectResult.grade)}
                                        </td>
                                        <td className="text-dark-400">
                                            {formatArabicNumber(subjectResult.subject.maxGrade)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="grade-bar flex-1 max-w-[100px]">
                                                    <div
                                                        className="grade-bar-fill"
                                                        style={{
                                                            width: `${subjectResult.percentage}%`,
                                                            backgroundColor: getGradeColor(subjectResult.percentage),
                                                        }}
                                                    />
                                                </div>
                                                <span
                                                    className="text-sm font-medium"
                                                    style={{ color: getGradeColor(subjectResult.percentage) }}
                                                >
                                                    {formatPercentage(subjectResult.percentage, 1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="text-sm font-medium"
                                                style={{ color: getGradeColor(subjectResult.percentage) }}
                                            >
                                                {getGradeLabel(subjectResult.percentage)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* المجموع الكلي */}
                    <div className="mt-8 pt-6 border-t border-dark-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                            {/* المجموع */}
                            <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                                <div className="text-dark-400 text-sm mb-2">المجموع</div>
                                <div className="text-2xl font-bold text-white">
                                    {formatArabicNumber(totalGrade)}
                                </div>
                                <div className="text-sm text-dark-400 mt-1">
                                    من {formatArabicNumber(maxTotalGrade)}
                                </div>
                            </div>

                            {/* النسبة المئوية */}
                            <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                                <div className="text-dark-400 text-sm mb-2">النسبة المئوية</div>
                                <div
                                    className="text-2xl font-bold"
                                    style={{ color: getGradeColor(percentage) }}
                                >
                                    {formatPercentage(percentage, 2)}
                                </div>
                            </div>

                            {/* التقدير العام */}
                            <div className="text-center p-4 bg-dark-700/30 rounded-xl">
                                <div className="text-dark-400 text-sm mb-2">التقدير العام</div>
                                <div
                                    className="text-2xl font-bold"
                                    style={{ color: getGradeColor(percentage) }}
                                >
                                    {getGradeLabel(percentage)}
                                </div>
                            </div>

                            {/* دائرة النسبة */}
                            <div className="flex justify-center">
                                <div className="relative w-24 h-24">
                                    <svg className="progress-ring w-full h-full" viewBox="0 0 100 100">
                                        {/* الخلفية */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            className="text-dark-700"
                                        />
                                        {/* التقدم */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke={getGradeColor(percentage)}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            className="progress-ring-circle"
                                            strokeDasharray={`${2 * Math.PI * 45}`}
                                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span
                                            className="text-lg font-bold"
                                            style={{ color: getGradeColor(percentage) }}
                                        >
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* تذييل البطاقة */}
                <div className="bg-dark-800/50 px-6 py-4 text-center text-dark-500 text-xs">
                    تم إصدار هذه النتيجة إلكترونياً من منصة نتائج الشهادات في جبل باشان
                </div>
            </div>

            {/* أزرار التصدير والمشاركة */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 no-print">
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`btn ${exportSuccess ? 'btn-success' : 'btn-primary'} w-full sm:w-auto`}
                >
                    {isExporting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            جاري التصدير...
                        </>
                    ) : exportSuccess ? (
                        <>
                            <Check className="w-5 h-5" />
                            تم التحميل بنجاح
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            تحميل كصورة HD
                        </>
                    )}
                </button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button onClick={handleShare} className="btn btn-secondary w-full sm:w-auto">
                        <Share2 className="w-5 h-5" />
                        مشاركة النتيجة
                    </button>
                )}
            </div>

            {/* رابط تقديم اعتراض */}
            <div className="mt-6 pt-6 border-t border-dark-700 text-center">
                <p className="text-dark-400 text-sm mb-2">
                    هل لديك اعتراض على نتيجتك؟
                </p>
                <a
                    href="/objection"
                    className="text-primary hover:text-primary-light transition-colors inline-flex items-center gap-2"
                >
                    تقديم طلب اعتراض ←
                </a>
            </div>
        </div>
    );
}
