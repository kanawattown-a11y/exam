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
    Users,
    Filter
} from 'lucide-react';
import {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getSections,
    getCertificateTypes
} from '@/lib/db';
import { formatArabicNumber, formatArabicDate } from '@/lib/utils';
import type { Student, Section, CertificateType } from '@/types';

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSection, setFilterSection] = useState<number | 'all'>('all');

    // حالة النموذج
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState({
        subscriptionNumber: '',
        fullName: '',
        sectionId: 0,
        certificateTypeId: 0,
        manualFail: false,
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
            const [loadedStudents, loadedSections, loadedCertTypes] = await Promise.all([
                getStudents(),
                getSections(),
                getCertificateTypes(),
            ]);
            setStudents(loadedStudents);
            setSections(loadedSections);
            setCertificateTypes(loadedCertTypes);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // فتح نموذج الإضافة
    const handleAdd = () => {
        setEditingStudent(null);
        setFormData({
            subscriptionNumber: '',
            fullName: '',
            sectionId: sections[0]?.id || 0,
            certificateTypeId: certificateTypes[0]?.id || 0,
            manualFail: false,
        });
        setFormError(null);
        setShowForm(true);
    };

    // فتح نموذج التعديل
    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            subscriptionNumber: student.subscriptionNumber,
            fullName: student.fullName,
            sectionId: student.sectionId,
            certificateTypeId: student.certificateTypeId,
            manualFail: student.manualFail || false,
        });
        setFormError(null);
        setShowForm(true);
    };

    // حفظ الطالب
    const handleSave = async () => {
        if (!formData.subscriptionNumber.trim()) {
            setFormError('يرجى إدخال رقم الاكتتاب');
            return;
        }
        if (!formData.fullName.trim()) {
            setFormError('يرجى إدخال اسم الطالب');
            return;
        }
        if (!formData.sectionId) {
            setFormError('يرجى اختيار القسم');
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            if (editingStudent) {
                // تعديل
                updateStudent(editingStudent.id, formData);
            } else {
                // إضافة
                addStudent(formData);
            }

            loadData();
            setShowForm(false);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    // حذف الطالب
    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع نتائجه أيضاً.')) {
            return;
        }

        setDeletingId(id);

        setTimeout(() => {
            deleteStudent(id);
            loadData();
            setDeletingId(null);
        }, 500);
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
                        إدارة الطلاب
                    </h1>
                    <p className="text-dark-400">
                        إجمالي الطلاب: {formatArabicNumber(students.length)}
                    </p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    إضافة طالب
                </button>
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

            {/* جدول الطلاب */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>رقم الاكتتاب</th>
                                <th>الاسم الكامل</th>
                                <th>القسم</th>
                                <th>الحالة</th>
                                <th>تاريخ الإضافة</th>
                                <th className="w-28">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <Users className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                        <p className="text-dark-400">لا يوجد طلاب</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, index) => (
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
                                        <td>
                                            {student.manualFail ? (
                                                <span className="badge badge-error">راسب يدوي</span>
                                            ) : (
                                                <span className="badge badge-success">عادي</span>
                                            )}
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            {formatArabicDate(student.createdAt)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4 text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    disabled={deletingId === student.id}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    {deletingId === student.id ? (
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

                    <div className="relative w-full max-w-lg glass-strong rounded-2xl p-6 fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">
                                {editingStudent ? 'تعديل طالب' : 'إضافة طالب جديد'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* رقم الاكتتاب */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    رقم الاكتتاب
                                </label>
                                <input
                                    type="text"
                                    value={formData.subscriptionNumber}
                                    onChange={(e) => setFormData({ ...formData, subscriptionNumber: e.target.value })}
                                    placeholder="أدخل رقم الاكتتاب"
                                    className="input"
                                    dir="ltr"
                                    disabled={!!editingStudent}
                                />
                            </div>

                            {/* الاسم الكامل */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    الاسم الكامل
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    placeholder="أدخل اسم الطالب الكامل"
                                    className="input"
                                />
                            </div>

                            {/* نوع الشهادة */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    نوع الشهادة
                                </label>
                                <select
                                    value={formData.certificateTypeId}
                                    onChange={(e) => setFormData({ ...formData, certificateTypeId: Number(e.target.value) })}
                                    className="input appearance-none cursor-pointer"
                                >
                                    {certificateTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name} - {type.year}
                                        </option>
                                    ))}
                                </select>
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

                            {/* الرسوب اليدوي */}
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="manualFail"
                                    checked={formData.manualFail}
                                    onChange={(e) => setFormData({ ...formData, manualFail: e.target.checked })}
                                    className="w-5 h-5 rounded border-dark-500 bg-dark-700 text-red-500 focus:ring-red-500"
                                />
                                <label htmlFor="manualFail" className="text-red-400 cursor-pointer">
                                    رسوب يدوي (الطالب راسب بغض النظر عن درجاته)
                                </label>
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
