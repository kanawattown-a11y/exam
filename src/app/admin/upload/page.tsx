'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useCallback, useRef } from 'react';
import {
    Upload,
    FileSpreadsheet,
    Download,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
    FileUp,
    Table
} from 'lucide-react';
import { parseFile, generateTemplateExcel, type ParsedRow } from '@/lib/excel-parser';
import {
    getSections,
    getSubjects,
    bulkAddStudents,
    bulkAddResults,
    getStudentBySubscriptionNumber
} from '@/lib/db';
import { formatArabicNumber, createDownloadUrl } from '@/lib/utils';

type UploadState = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete';

export default function AdminUploadPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importResult, setImportResult] = useState<{
        studentsAdded: number;
        resultsAdded: number;
        errors: string[];
    } | null>(null);

    // معالجة اختيار الملف
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setUploadState('parsing');
        setParsedData([]);
        setParseErrors([]);
        setImportResult(null);

        const result = await parseFile(file);

        if (result.success && result.data.length > 0) {
            setParsedData(result.data);
            setParseErrors(result.errors);
            setUploadState('preview');
        } else {
            setParseErrors(result.errors.length > 0 ? result.errors : ['لم يتم العثور على بيانات صالحة']);
            setUploadState('idle');
        }

        // إعادة تعيين الـ input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // استيراد البيانات
    const handleImport = useCallback(async () => {
        setUploadState('importing');

        const sections = await getSections();
        const subjects = await getSubjects();

        const studentsToAdd: Parameters<typeof bulkAddStudents>[0] = [];
        const resultsToAdd: Parameters<typeof bulkAddResults>[0] = [];
        const errors: string[] = [];

        for (const row of parsedData) {
            // العثور على القسم
            const section = sections.find(s => s.name === row.section);
            if (!section) {
                errors.push(`الصف ${row.subscriptionNumber}: القسم "${row.section}" غير موجود`);
                continue;
            }

            // التحقق من وجود الطالب
            let student = await getStudentBySubscriptionNumber(row.subscriptionNumber);

            if (!student) {
                // إضافة طالب جديد
                studentsToAdd.push({
                    subscriptionNumber: row.subscriptionNumber,
                    fullName: row.fullName,
                    sectionId: section.id,
                    certificateTypeId: section.certificateTypeId,
                });
            }

            // تجهيز النتائج
            for (const [subjectName, grade] of Object.entries(row.grades)) {
                const subject = subjects.find(s => s.name === subjectName && s.sectionId === section.id);
                if (subject) {
                    // سيتم إضافة studentId لاحقاً
                    resultsToAdd.push({
                        studentId: 0, // مؤقت
                        subjectId: subject.id,
                        grade,
                        _subscriptionNumber: row.subscriptionNumber, // للربط لاحقاً
                    } as any);
                }
            }
        }

        // إضافة الطلاب
        const studentsResult = await bulkAddStudents(studentsToAdd);
        errors.push(...studentsResult.errors);

        // ربط النتائج بالطلاب وإضافتها
        const finalResults: Parameters<typeof bulkAddResults>[0] = [];
        for (const result of resultsToAdd) {
            const student = await getStudentBySubscriptionNumber((result as any)._subscriptionNumber);
            if (student) {
                finalResults.push({
                    studentId: student.id,
                    subjectId: result.subjectId,
                    grade: result.grade,
                });
            }
        }

        const resultsResult = await bulkAddResults(finalResults);
        errors.push(...resultsResult.errors);

        setImportResult({
            studentsAdded: studentsResult.success,
            resultsAdded: resultsResult.success,
            errors,
        });

        setUploadState('complete');
    }, [parsedData]);

    // تحميل القالب
    const handleDownloadTemplate = useCallback(() => {
        const blob = generateTemplateExcel();
        createDownloadUrl(blob, 'قالب_النتائج.xlsx');
    }, []);

    // إعادة التعيين
    const handleReset = useCallback(() => {
        setUploadState('idle');
        setParsedData([]);
        setParseErrors([]);
        setFileName('');
        setImportResult(null);
    }, []);

    // السحب والإفلات
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    return (
        <div className="space-y-6 fade-in">
            {/* العنوان */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                        رفع الملفات
                    </h1>
                    <p className="text-dark-400">
                        استيراد بيانات الطلاب والنتائج من ملفات Excel أو CSV
                    </p>
                </div>
                <button onClick={handleDownloadTemplate} className="btn btn-secondary">
                    <Download className="w-5 h-5" />
                    تحميل القالب
                </button>
            </div>

            {/* منطقة الرفع */}
            {uploadState === 'idle' && (
                <div
                    className="card border-2 border-dashed border-dark-600 hover:border-primary transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                            <FileUp className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            اسحب الملف هنا أو انقر للاختيار
                        </h3>
                        <p className="text-dark-400 text-sm">
                            ملفات Excel (.xlsx, .xls) أو CSV مدعومة
                        </p>
                    </div>
                </div>
            )}

            {/* حالة القراءة */}
            {uploadState === 'parsing' && (
                <div className="card text-center py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">جاري قراءة الملف...</p>
                    <p className="text-dark-400 text-sm mt-1">{fileName}</p>
                </div>
            )}

            {/* معاينة البيانات */}
            {uploadState === 'preview' && (
                <div className="space-y-6">
                    {/* معلومات الملف */}
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">{fileName}</p>
                                    <p className="text-sm text-dark-400">
                                        {formatArabicNumber(parsedData.length)} سجل جاهز للاستيراد
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* أخطاء القراءة */}
                    {parseErrors.length > 0 && (
                        <div className="card border border-amber-500/30 bg-amber-500/5">
                            <div className="flex items-center gap-2 text-amber-400 mb-3">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">تحذيرات ({formatArabicNumber(parseErrors.length)})</span>
                            </div>
                            <ul className="text-sm text-dark-300 space-y-1 max-h-32 overflow-y-auto">
                                {parseErrors.slice(0, 10).map((error, i) => (
                                    <li key={i}>• {error}</li>
                                ))}
                                {parseErrors.length > 10 && (
                                    <li className="text-dark-400">... و {formatArabicNumber(parseErrors.length - 10)} تحذيرات أخرى</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* معاينة الجدول */}
                    <div className="card overflow-hidden p-0">
                        <div className="p-4 border-b border-dark-700 flex items-center gap-2">
                            <Table className="w-5 h-5 text-primary" />
                            <span className="font-medium">معاينة البيانات</span>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                            <table className="table-modern">
                                <thead className="sticky top-0">
                                    <tr>
                                        <th>#</th>
                                        <th>رقم الاكتتاب</th>
                                        <th>الاسم الكامل</th>
                                        <th>القسم</th>
                                        <th>عدد المواد</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 50).map((row, index) => (
                                        <tr key={index}>
                                            <td className="text-dark-400">{formatArabicNumber(index + 1)}</td>
                                            <td className="font-mono" dir="ltr">{row.subscriptionNumber}</td>
                                            <td>{row.fullName}</td>
                                            <td>
                                                <span className="badge badge-info">{row.section}</span>
                                            </td>
                                            <td>{formatArabicNumber(Object.keys(row.grades).length)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedData.length > 50 && (
                                <div className="p-4 text-center text-dark-400 text-sm border-t border-dark-700">
                                    يتم عرض أول 50 سجل فقط من أصل {formatArabicNumber(parsedData.length)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex items-center gap-4">
                        <button onClick={handleImport} className="btn btn-primary flex-1">
                            <Upload className="w-5 h-5" />
                            استيراد البيانات
                        </button>
                        <button onClick={handleReset} className="btn btn-secondary">
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* حالة الاستيراد */}
            {uploadState === 'importing' && (
                <div className="card text-center py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-white font-medium">جاري استيراد البيانات...</p>
                    <p className="text-dark-400 text-sm mt-1">
                        {formatArabicNumber(parsedData.length)} سجل
                    </p>
                </div>
            )}

            {/* نتيجة الاستيراد */}
            {uploadState === 'complete' && importResult && (
                <div className="space-y-6">
                    {/* ملخص النتيجة */}
                    <div className="card border border-emerald-500/30 bg-emerald-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">تم الاستيراد بنجاح!</h3>
                                <p className="text-dark-400 text-sm">تمت معالجة الملف بنجاح</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-400">
                                    {formatArabicNumber(importResult.studentsAdded)}
                                </p>
                                <p className="text-dark-400 text-sm">طالب جديد</p>
                            </div>
                            <div className="bg-dark-700/50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-primary">
                                    {formatArabicNumber(importResult.resultsAdded)}
                                </p>
                                <p className="text-dark-400 text-sm">نتيجة مسجلة</p>
                            </div>
                        </div>
                    </div>

                    {/* أخطاء الاستيراد */}
                    {importResult.errors.length > 0 && (
                        <div className="card border border-red-500/30 bg-red-500/5">
                            <div className="flex items-center gap-2 text-red-400 mb-3">
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">أخطاء ({formatArabicNumber(importResult.errors.length)})</span>
                            </div>
                            <ul className="text-sm text-dark-300 space-y-1 max-h-48 overflow-y-auto">
                                {importResult.errors.map((error, i) => (
                                    <li key={i}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* زر البدء من جديد */}
                    <button onClick={handleReset} className="btn btn-primary w-full">
                        <Upload className="w-5 h-5" />
                        رفع ملف آخر
                    </button>
                </div>
            )}

            {/* تعليمات */}
            <div className="card bg-dark-800/50">
                <h3 className="font-semibold text-white mb-4">تعليمات الاستخدام</h3>
                <ul className="space-y-2 text-dark-300 text-sm">
                    <li>• يجب أن يحتوي الملف على الأعمدة: <span className="text-primary">رقم الاكتتاب</span>، <span className="text-primary">الاسم الكامل</span>، <span className="text-primary">القسم</span></li>
                    <li>• الأعمدة الإضافية تعتبر مواد دراسية (مثل: الرياضيات، الفيزياء، إلخ)</li>
                    <li>• تأكد من تطابق أسماء الأقسام والمواد مع المسجلة في النظام</li>
                    <li>• يمكنك تحميل القالب كمرجع للتنسيق الصحيح</li>
                </ul>
            </div>
        </div>
    );
}
