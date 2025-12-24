'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    Check,
    X,
    Layers
} from 'lucide-react';
import {
    getSections,
    addSection,
    updateSection,
    deleteSection,
    getCertificateTypes
} from '@/lib/db';
import { formatArabicNumber } from '@/lib/utils';
import type { Section, CertificateType } from '@/types';

export default function AdminSectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // حالة النموذج
    const [showForm, setShowForm] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        certificateTypeId: 0,
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
            const [loadedSections, loadedCertTypes] = await Promise.all([
                getSections(),
                getCertificateTypes(),
            ]);
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
        setEditingSection(null);
        setFormData({
            name: '',
            certificateTypeId: certificateTypes[0]?.id || 0,
        });
        setFormError(null);
        setShowForm(true);
    };

    // فتح نموذج التعديل
    const handleEdit = (section: Section) => {
        setEditingSection(section);
        setFormData({
            name: section.name,
            certificateTypeId: section.certificateTypeId,
        });
        setFormError(null);
        setShowForm(true);
    };

    // حفظ القسم
    const handleSave = async () => {
        if (!formData.name.trim()) {
            setFormError('يرجى إدخال اسم القسم');
            return;
        }

        setIsSaving(true);
        setFormError(null);

        try {
            if (editingSection) {
                updateSection(editingSection.id, formData);
            } else {
                addSection(formData);
            }

            loadData();
            setShowForm(false);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    // حذف القسم
    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) {
            return;
        }

        setDeletingId(id);

        setTimeout(() => {
            deleteSection(id);
            loadData();
            setDeletingId(null);
        }, 500);
    };

    // الحصول على اسم نوع الشهادة
    const getCertificateTypeName = (id: number) => {
        return certificateTypes.find(c => c.id === id)?.name || '-';
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
                        إدارة الأقسام
                    </h1>
                    <p className="text-dark-400">
                        إجمالي الأقسام: {formatArabicNumber(sections.length)}
                    </p>
                </div>
                <button onClick={handleAdd} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    إضافة قسم
                </button>
            </div>

            {/* قائمة الأقسام */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.length === 0 ? (
                    <div className="col-span-full card text-center py-12">
                        <Layers className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                        <p className="text-dark-400">لا يوجد أقسام</p>
                    </div>
                ) : (
                    sections.map((section, index) => (
                        <div
                            key={section.id}
                            className="card hover:border-primary/30 transition-colors fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Layers className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEdit(section)}
                                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                        title="تعديل"
                                    >
                                        <Edit className="w-4 h-4 text-primary" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(section.id)}
                                        disabled={deletingId === section.id}
                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="حذف"
                                    >
                                        {deletingId === section.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                        ) : (
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2">
                                {section.name}
                            </h3>
                            <p className="text-dark-400 text-sm">
                                {getCertificateTypeName(section.certificateTypeId)}
                            </p>
                        </div>
                    ))
                )}
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
                                {editingSection ? 'تعديل قسم' : 'إضافة قسم جديد'}
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* اسم القسم */}
                            <div>
                                <label className="block text-dark-300 text-sm font-medium mb-2">
                                    اسم القسم
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="مثال: علمي"
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
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
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
