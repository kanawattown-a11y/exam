'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    Check,
    X,
    BookOpen,
    Filter
} from 'lucide-react';
import {
    getSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSections
} from '@/lib/db';
import { formatArabicNumber } from '@/lib/utils';
import type { Subject, Section } from '@/types';

export default function AdminSubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterSection, setFilterSection] = useState<number | 'all'>('all');

    // حالة النموذج
    const [showForm, setShowForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        sectionId: 0,
        maxGrade: 100,
        minGrade: 50,
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // حالة الحذف
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [loadedSubjects, loadedSections] = await Promise.all([
                getSubjects(),
                getSections(),
            ]);
            setSubjects(loadedSubjects);
            setSections(loadedSections);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // فتح نموذج الإضافة
    const handleAdd = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            sectionId: sections[0]?.id || 0,
            maxGrade: 100,
            minGrade: 50,
        });
        setFormError(null);
        setShowForm(true);
    };

    // فتح نموذج التعديل
    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            sectionId: subject.sectionId,
            maxGrade: subject.maxGrade,
            minGrade: subject.minGrade || Math.floor(subject.maxGrade * 0.5),
        });
        setFormError(null);
        setShowForm(true);
    };

    // حفظ المادة
    const handleSave = async () => {
        if (!formData.name.trim()) {
            setFormError('يرجى إدخال اسم المادة');
            return;
        }
        if (formData.maxGrade <= 0) {
            setFormError('الدرجة العظمى يجب أن تكون أكبر من صفر');
            return;
        }
        if (formData.minGrade < 0 || formData.minGrade > formData.maxGrade) {
            setFormError('الدرجة الدنيا يجب أن تكون بين 0 والدرجة العظمى');
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            if (editingSubject) {
                updateSubject(editingSubject.id, formData);
            } else {
                addSubject(formData);
            }

            loadData();
            setShowForm(false);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    // حذف المادة
    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) {
            return;
        }

        setDeletingId(id);

        setTimeout(() => {
            deleteSubject(id);
            loadData();
            setDeletingId(null);
        }, 500);
    };

    // الحصول على اسم القسم
    const getSectionName = (id: number) => {
        return sections.find(s => s.id === id)?.name || '-';
    };

    // تصفية المواد
    const filteredSubjects = filterSection === 'all'
        ? subjects
        : subjects.filter(s => s.sectionId === filterSection);

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
                        إدارة المواد الدراسية
                    </h1>
                    <p className="text-dark-400">
                        إجمالي المواد: {formatArabicNumber(subjects.length)}
                    </p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    إضافة مادة
                </button>
            </div>

            {/* فلتر القسم */}
            <div className="card">
                <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-dark-400" />
                    <select
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="input max-w-xs appearance-none cursor-pointer"
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

            {/* جدول المواد */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>اسم المادة</th>
                                <th>القسم</th>
                                <th>الدرجة العظمى</th>
                                <th>الدرجة الدنيا</th>
                                <th className="w-28">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <BookOpen className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                        <p className="text-dark-400">لا يوجد مواد</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSubjects.map((subject, index) => (
                                    <tr
                                        key={subject.id}
                                        className="fade-in"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                                    <BookOpen className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{subject.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-info">
                                                {getSectionName(subject.sectionId)}
                                            </span>
                                        </td>
                                        <td className="font-bold text-primary">
                                            {formatArabicNumber(subject.maxGrade)}
                                        </td>
                                        <td className="font-bold text-amber-400">
                                            {formatArabicNumber(subject.minGrade || Math.floor(subject.maxGrade * 0.5))}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(subject)}
                                                    className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4 text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    disabled={deletingId === subject.id}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    {deletingId === subject.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* نافذة النموذج */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowForm(false)}
                    />

                    <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">
                                {editingSubject ? 'تعديل مادة' : 'إضافة مادة جديدة'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* اسم المادة */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    اسم المادة
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="مثال: الرياضيات"
                                    className="input"
                                />
                            </div>

                            {/* القسم */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    القسم
                                </label>
                                <select
                                    value={formData.sectionId}
                                    onChange={(e) => setFormData({ ...formData, sectionId: Number(e.target.value) })}
                                    className="input appearance-none cursor-pointer"
                                >
                                    {sections.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* الدرجة العظمى */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    الدرجة العظمى
                                </label>
                                <input
                                    type="number"
                                    value={formData.maxGrade}
                                    onChange={(e) => setFormData({ ...formData, maxGrade: Number(e.target.value) })}
                                    min="1"
                                    className="input"
                                    dir="ltr"
                                />
                            </div>

                            {/* الدرجة الدنيا */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    الدرجة الدنيا (للنجاح)
                                </label>
                                <input
                                    type="number"
                                    value={formData.minGrade}
                                    onChange={(e) => setFormData({ ...formData, minGrade: Number(e.target.value) })}
                                    min="0"
                                    max={formData.maxGrade}
                                    className="input"
                                    dir="ltr"
                                />
                                <p className="text-dark-500 text-xs mt-1">الطالب يرسب إذا حصل على درجة أقل من هذا الحد</p>
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
                                            حفظ
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
