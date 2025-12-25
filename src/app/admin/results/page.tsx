'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    Check,
    X,
    FileSpreadsheet,
    Filter
} from 'lucide-react';
import {
    getStudents,
    getSubjects,
    getSections,
    getResults,
    addResult,
    updateResult,
    deleteResult,
    getResultsByStudentId
} from '@/lib/db';
import { formatArabicNumber } from '@/lib/utils';
import type { Student, Subject, Result, Section } from '@/types';

export default function AdminResultsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSection, setFilterSection] = useState<number | 'all'>('all');

    // حالة النموذج
    const [showForm, setShowForm] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentResults, setStudentResults] = useState<{ subjectId: number; grade: string }[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [loadedStudents, loadedSubjects, loadedSections, loadedResults] = await Promise.all([
                getStudents(),
                getSubjects(),
                getSections(),
                getResults(),
            ]);
            setStudents(loadedStudents);
            setSubjects(loadedSubjects);
            setSections(loadedSections);
            setResults(loadedResults);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // فتح نموذج إضافة/تعديل النتائج
    const handleEditResults = async (student: Student) => {
        setSelectedStudent(student);

        // جلب مواد القسم
        const sectionSubjects = subjects.filter(s => s.sectionId === student.sectionId);

        // جلب النتائج الحالية
        const existingResults = await getResultsByStudentId(student.id);

        // تجهيز بيانات النموذج
        const formResults = sectionSubjects.map(subject => {
            const existing = existingResults.find(r => r.subjectId === subject.id);
            return {
                subjectId: subject.id,
                grade: existing ? String(existing.grade) : '',
            };
        });

        setStudentResults(formResults);
        setFormError(null);
        setShowForm(true);
    };

    // حفظ النتائج
    const handleSave = async () => {
        if (!selectedStudent) return;

        setIsSaving(true);
        setFormError(null);

        try {
            // جلب النتائج الحالية
            const existingResults = await getResultsByStudentId(selectedStudent.id);

            for (const result of studentResults) {
                const grade = parseFloat(result.grade);
                if (isNaN(grade) || grade < 0) continue;

                const existing = existingResults.find(r => r.subjectId === result.subjectId);

                if (existing) {
                    // تحديث النتيجة
                    await updateResult(existing.id, { grade });
                } else if (result.grade) {
                    // إضافة نتيجة جديدة
                    addResult({
                        studentId: selectedStudent.id,
                        subjectId: result.subjectId,
                        grade,
                    });
                }
            }

            loadData();
            setShowForm(false);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    // تحديث درجة في النموذج
    const handleGradeChange = (subjectId: number, value: string) => {
        setStudentResults(prev =>
            prev.map(r =>
                r.subjectId === subjectId ? { ...r, grade: value } : r
            )
        );
    };

    // تصفية الطلاب
    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.fullName.includes(searchTerm) ||
            student.subscriptionNumber.includes(searchTerm);

        const matchesSection =
            filterSection === 'all' || student.sectionId === filterSection;

        return matchesSearch && matchesSection;
    });

    // الحصول على اسم القسم
    const getSectionName = (sectionId: number) => {
        return sections.find(s => s.id === sectionId)?.name || '-';
    };

    // حساب مجموع الطالب
    const getStudentTotal = (studentId: number) => {
        const studentResults = results.filter(r => r.studentId === studentId);
        const total = studentResults.reduce((sum, r) => sum + r.grade, 0);
        return total;
    };

    // الحصول على اسم المادة
    const getSubjectName = (subjectId: number) => {
        return subjects.find(s => s.id === subjectId)?.name || '-';
    };

    // الحصول على الدرجة العظمى للمادة
    const getSubjectMaxGrade = (subjectId: number) => {
        return subjects.find(s => s.id === subjectId)?.maxGrade || 100;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-in">
            {/* العنوان */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                    إدارة النتائج
                </h1>
                <p className="text-dark-400">
                    إجمالي النتائج المسجلة: {formatArabicNumber(results.length)}
                </p>
            </div>

            {/* أدوات البحث والتصفية */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* البحث */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث بالاسم أو رقم الاكتتاب..."
                            className="input pl-12"
                        />
                    </div>

                    {/* تصفية القسم */}
                    <div className="w-full md:w-48">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                            <select
                                value={filterSection}
                                onChange={(e) => setFilterSection(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="input pl-12 appearance-none cursor-pointer"
                            >
                                <option value="all">جميع الأقسام</option>
                                {sections.map(section => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* جدول الطلاب والنتائج */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>رقم الاكتتاب</th>
                                <th>الاسم الكامل</th>
                                <th>القسم</th>
                                <th>المجموع</th>
                                <th>الحالة</th>
                                <th className="w-28">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <FileSpreadsheet className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                        <p className="text-dark-400">لا يوجد طلاب</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, index) => {
                                    const total = getStudentTotal(student.id);
                                    const hasResults = results.some(r => r.studentId === student.id);

                                    return (
                                        <tr
                                            key={student.id}
                                            className="fade-in"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <td className="font-mono" dir="ltr">{student.subscriptionNumber}</td>
                                            <td className="font-medium">{student.fullName}</td>
                                            <td>
                                                <span className="badge badge-info">
                                                    {getSectionName(student.sectionId)}
                                                </span>
                                            </td>
                                            <td className="font-bold">
                                                {hasResults ? formatArabicNumber(total) : '-'}
                                            </td>
                                            <td>
                                                {hasResults ? (
                                                    <span className="badge badge-success">تم التسجيل</span>
                                                ) : (
                                                    <span className="badge badge-warning">لم يتم التسجيل</span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleEditResults(student)}
                                                    className="btn btn-secondary py-2 px-4 text-sm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    {hasResults ? 'تعديل' : 'إضافة'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* نافذة نموذج النتائج */}
            {showForm && selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowForm(false)}
                    />

                    <div className="relative w-full max-w-2xl glass-strong rounded-2xl p-6 fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">
                                    تسجيل نتائج الطالب
                                </h3>
                                <p className="text-dark-400 text-sm mt-1">
                                    {selectedStudent.fullName} - {selectedStudent.subscriptionNumber}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* جدول المواد والدرجات */}
                            <div className="bg-dark-700/50 rounded-xl overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-dark-600">
                                            <th className="text-right py-3 px-4 font-medium text-dark-300">المادة</th>
                                            <th className="text-right py-3 px-4 font-medium text-dark-300 w-24">العظمى</th>
                                            <th className="text-right py-3 px-4 font-medium text-dark-300 w-32">الدرجة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentResults.map((result, index) => (
                                            <tr
                                                key={result.subjectId}
                                                className="border-b border-dark-600/50 last:border-0"
                                            >
                                                <td className="py-3 px-4 font-medium">
                                                    {getSubjectName(result.subjectId)}
                                                </td>
                                                <td className="py-3 px-4 text-dark-400">
                                                    {formatArabicNumber(getSubjectMaxGrade(result.subjectId))}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <input
                                                        type="number"
                                                        value={result.grade}
                                                        onChange={(e) => handleGradeChange(result.subjectId, e.target.value)}
                                                        min="0"
                                                        max={getSubjectMaxGrade(result.subjectId)}
                                                        className="input py-2 w-full"
                                                        dir="ltr"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* المجموع */}
                            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-primary font-medium">المجموع الكلي:</span>
                                <span className="text-2xl font-bold text-white">
                                    {formatArabicNumber(
                                        studentResults.reduce((sum, r) => sum + (parseFloat(r.grade) || 0), 0)
                                    )}
                                </span>
                            </div>

                            {/* رسالة الخطأ */}
                            {formError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    ⚠️ {formError}
                                </div>
                            )}

                            {/* الأزرار */}
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="btn btn-primary flex-1"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري الحفظ...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            حفظ النتائج
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="btn btn-secondary"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
