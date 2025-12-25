'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import {
    Send,
    Loader2,
    CheckCircle,
    AlertCircle,
    FileText,
    User,
    Phone,
    Hash,
    Layers,
} from 'lucide-react';
import { getSections, addObjection } from '@/lib/db';
import type { Section } from '@/types';

export default function ObjectionPage() {
    const [mounted, setMounted] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        subscriptionNumber: '',
        fullName: '',
        sectionId: 0,
        phone: '',
        objectionText: '',
    });

    useEffect(() => {
        const loadSections = async () => {
            setMounted(true);
            try {
                const loadedSections = await getSections();
                setSections(loadedSections);
                if (loadedSections.length > 0) {
                    setFormData(prev => ({ ...prev, sectionId: loadedSections[0].id }));
                }
            } catch (error) {
                console.error('Error loading sections:', error);
            }
        };
        loadSections();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // التحقق من البيانات
        if (!formData.subscriptionNumber.trim()) {
            setError('يرجى إدخال رقم الاكتتاب');
            return;
        }
        if (!formData.fullName.trim()) {
            setError('يرجى إدخال الاسم الكامل');
            return;
        }
        if (!formData.objectionText.trim()) {
            setError('يرجى كتابة نص الاعتراض');
            return;
        }

        setIsSubmitting(true);

        try {
            await addObjection({
                subscriptionNumber: formData.subscriptionNumber.trim(),
                fullName: formData.fullName.trim(),
                sectionId: formData.sectionId,
                phone: formData.phone.trim() || undefined,
                objectionText: formData.objectionText.trim(),
            });

            setSubmitSuccess(true);
            // إعادة تعيين النموذج
            setFormData({
                subscriptionNumber: '',
                fullName: '',
                sectionId: sections[0]?.id || 0,
                phone: '',
                objectionText: '',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الاعتراض');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-900">
                <div className="spinner" />
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
                <div className="glass-strong rounded-2xl p-8 max-w-md w-full text-center fade-in">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">
                        تم إرسال الاعتراض بنجاح!
                    </h1>
                    <p className="text-dark-400 mb-6">
                        سيتم مراجعة طلبك من قبل الإدارة وسيتم الرد عليه في أقرب وقت.
                    </p>
                    <button
                        onClick={() => setSubmitSuccess(false)}
                        className="btn btn-primary w-full"
                    >
                        تقديم اعتراض آخر
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* العنوان */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center glow-primary">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        تقديم طلب اعتراض
                    </h1>
                    <p className="text-dark-400">
                        يمكنك تقديم اعتراض على نتيجتك من خلال النموذج أدناه
                    </p>
                </div>

                {/* النموذج */}
                <form onSubmit={handleSubmit} className="card space-y-6">
                    {/* رقم الاكتتاب */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            رقم الاكتتاب *
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                            <input
                                type="text"
                                value={formData.subscriptionNumber}
                                onChange={(e) => setFormData({ ...formData, subscriptionNumber: e.target.value })}
                                placeholder="أدخل رقم الاكتتاب"
                                className="input pl-12 text-right"
                            />
                        </div>
                    </div>

                    {/* الاسم الكامل */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            الاسم الكامل *
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="الاسم الثلاثي"
                                className="input pl-12"
                            />
                        </div>
                    </div>

                    {/* القسم */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            القسم *
                        </label>
                        <div className="relative">
                            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                            <select
                                value={formData.sectionId}
                                onChange={(e) => setFormData({ ...formData, sectionId: Number(e.target.value) })}
                                className="input pl-12 appearance-none cursor-pointer"
                            >
                                {sections.map(section => (
                                    <option key={section.id} value={section.id}>
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* رقم الهاتف */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            رقم الهاتف (اختياري)
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="للتواصل معك"
                                className="input pl-12 text-right"
                            />
                        </div>
                    </div>

                    {/* نص الاعتراض */}
                    <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                            نص الاعتراض *
                        </label>
                        <textarea
                            value={formData.objectionText}
                            onChange={(e) => setFormData({ ...formData, objectionText: e.target.value })}
                            placeholder="اكتب تفاصيل اعتراضك هنا... (المادة التي تعترض عليها، السبب، إلخ)"
                            className="input min-h-[150px] resize-none"
                            rows={5}
                        />
                    </div>

                    {/* رسالة الخطأ */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* زر الإرسال */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary w-full py-4 text-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                جاري الإرسال...
                            </>
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                إرسال الاعتراض
                            </>
                        )}
                    </button>

                    <p className="text-center text-dark-500 text-sm">
                        * الحقول المطلوبة
                    </p>
                </form>
            </div>
        </div>
    );
}
