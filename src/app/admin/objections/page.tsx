'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    Filter,
    Trash2,
    Loader2,
    FileSpreadsheet,
    Download,
    Image,
    Eye,
    X,
    MessageSquare,
    Check,
    Clock,
    XCircle,
    CheckCircle,
} from 'lucide-react';
import { getObjections, updateObjection, deleteObjection, getSections } from '@/lib/db';
import { formatArabicNumber, formatArabicDate } from '@/lib/utils';
import type { Objection, Section } from '@/types';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

const STATUS_LABELS: Record<Objection['status'], string> = {
    new: 'جديد',
    reviewing: 'قيد المراجعة',
    accepted: 'مقبول',
    rejected: 'مرفوض',
};

const STATUS_COLORS: Record<Objection['status'], string> = {
    new: 'badge-warning',
    reviewing: 'badge-info',
    accepted: 'badge-success',
    rejected: 'badge-error',
};

export default function AdminObjectionsPage() {
    const [objections, setObjections] = useState<Objection[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<Objection['status'] | 'all'>('all');
    const [filterSection, setFilterSection] = useState<number | 'all'>('all');

    // نافذة التفاصيل
    const [selectedObjection, setSelectedObjection] = useState<Objection | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const detailsRef = useRef<HTMLDivElement>(null);

    // حذف
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [loadedObjections, loadedSections] = await Promise.all([
                getObjections(),
                getSections(),
            ]);
            setObjections(loadedObjections);
            setSections(loadedSections);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // الحصول على اسم القسم
    const getSectionName = (sectionId: number) => {
        return sections.find(s => s.id === sectionId)?.name || '-';
    };

    // تصفية الاعتراضات
    const filteredObjections = objections.filter(obj => {
        const matchesSearch =
            obj.subscriptionNumber.includes(searchTerm) ||
            obj.fullName.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || obj.status === filterStatus;
        const matchesSection = filterSection === 'all' || obj.sectionId === filterSection;
        return matchesSearch && matchesStatus && matchesSection;
    });

    // تغيير الحالة
    const handleStatusChange = async (id: number, status: Objection['status']) => {
        await updateObjection(id, { status });
        await loadData();
        if (selectedObjection?.id === id) {
            setSelectedObjection({ ...selectedObjection, status });
        }
    };

    // حذف الاعتراض
    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الاعتراض؟')) return;
        setDeletingId(id);
        try {
            await deleteObjection(id);
            await loadData();
            if (selectedObjection?.id === id) {
                setSelectedObjection(null);
            }
        } finally {
            setDeletingId(null);
        }
    };

    // تصدير Excel
    const handleExportExcel = () => {
        const data = filteredObjections.map(obj => ({
            'رقم الاكتتاب': obj.subscriptionNumber,
            'الاسم الكامل': obj.fullName,
            'القسم': getSectionName(obj.sectionId),
            'رقم الهاتف': obj.phone || '-',
            'نص الاعتراض': obj.objectionText,
            'الحالة': STATUS_LABELS[obj.status],
            'تاريخ التقديم': new Date(obj.createdAt).toLocaleDateString('ar-SY'),
            'ملاحظة الإدارة': obj.adminNote || '-',
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الاعتراضات');

        // ضبط عرض الأعمدة
        worksheet['!cols'] = [
            { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
            { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        ];

        XLSX.writeFile(workbook, `اعتراضات_${new Date().toLocaleDateString('ar-SY')}.xlsx`);
    };

    // تصدير صورة
    const handleExportImage = async () => {
        if (!detailsRef.current || !selectedObjection) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(detailsRef.current, {
                backgroundColor: '#0f0f0f',
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `اعتراض_${selectedObjection.subscriptionNumber}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error exporting image:', error);
        } finally {
            setIsExporting(false);
        }
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
                        إدارة الاعتراضات
                    </h1>
                    <p className="text-dark-400">
                        إجمالي الاعتراضات: {formatArabicNumber(objections.length)}
                        {objections.filter(o => o.status === 'new').length > 0 && (
                            <span className="mr-2 text-yellow-400">
                                ({formatArabicNumber(objections.filter(o => o.status === 'new').length)} جديد)
                            </span>
                        )}
                    </p>
                </div>
                <button onClick={handleExportExcel} className="btn btn-secondary">
                    <Download className="w-5 h-5" />
                    تصدير Excel
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

                    {/* تصفية الحالة */}
                    <div className="w-full md:w-40">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as Objection['status'] | 'all')}
                            className="input appearance-none cursor-pointer"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="new">جديد</option>
                            <option value="reviewing">قيد المراجعة</option>
                            <option value="accepted">مقبول</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </div>

                    {/* تصفية القسم */}
                    <div className="w-full md:w-40">
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

            {/* جدول الاعتراضات */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>رقم الاكتتاب</th>
                                <th>الاسم الكامل</th>
                                <th>القسم</th>
                                <th>الحالة</th>
                                <th>التاريخ</th>
                                <th className="w-36">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredObjections.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-4" />
                                        <p className="text-dark-400">لا يوجد اعتراضات</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredObjections.map((obj, index) => (
                                    <tr
                                        key={obj.id}
                                        className="fade-in cursor-pointer hover:bg-dark-700/50"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                        onClick={() => setSelectedObjection(obj)}
                                    >
                                        <td className="font-mono" dir="ltr">{obj.subscriptionNumber}</td>
                                        <td className="font-medium">{obj.fullName}</td>
                                        <td>
                                            <span className="badge badge-info">
                                                {getSectionName(obj.sectionId)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${STATUS_COLORS[obj.status]}`}>
                                                {STATUS_LABELS[obj.status]}
                                            </span>
                                        </td>
                                        <td className="text-dark-400 text-sm">
                                            {formatArabicDate(obj.createdAt)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setSelectedObjection(obj)}
                                                    className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                                    title="عرض"
                                                >
                                                    <Eye className="w-4 h-4 text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(obj.id)}
                                                    disabled={deletingId === obj.id}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="حذف"
                                                >
                                                    {deletingId === obj.id ? (
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

            {/* نافذة التفاصيل */}
            {selectedObjection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedObjection(null)}
                    />

                    <div className="relative w-full max-w-2xl glass-strong rounded-2xl p-6 fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">تفاصيل الاعتراض</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportImage}
                                    disabled={isExporting}
                                    className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                    title="تصدير كصورة"
                                >
                                    {isExporting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Image className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setSelectedObjection(null)}
                                    className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div ref={detailsRef} className="space-y-4 p-4 bg-dark-800 rounded-xl">
                            {/* معلومات الطالب */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-dark-400 text-sm">رقم الاكتتاب</p>
                                    <p className="font-mono font-bold" dir="ltr">{selectedObjection.subscriptionNumber}</p>
                                </div>
                                <div>
                                    <p className="text-dark-400 text-sm">الاسم الكامل</p>
                                    <p className="font-bold">{selectedObjection.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-dark-400 text-sm">القسم</p>
                                    <p>{getSectionName(selectedObjection.sectionId)}</p>
                                </div>
                                <div>
                                    <p className="text-dark-400 text-sm">رقم الهاتف</p>
                                    <p dir="ltr">{selectedObjection.phone || '-'}</p>
                                </div>
                            </div>

                            {/* نص الاعتراض */}
                            <div>
                                <p className="text-dark-400 text-sm mb-2">نص الاعتراض</p>
                                <div className="p-4 bg-dark-700 rounded-xl">
                                    <p className="whitespace-pre-wrap">{selectedObjection.objectionText}</p>
                                </div>
                            </div>

                            {/* التاريخ والحالة */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-dark-400 text-sm">تاريخ التقديم</p>
                                    <p>{formatArabicDate(selectedObjection.createdAt)}</p>
                                </div>
                                <span className={`badge ${STATUS_COLORS[selectedObjection.status]} text-lg px-4 py-2`}>
                                    {STATUS_LABELS[selectedObjection.status]}
                                </span>
                            </div>
                        </div>

                        {/* تغيير الحالة */}
                        <div className="mt-6">
                            <p className="text-dark-400 text-sm mb-3">تغيير الحالة:</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleStatusChange(selectedObjection.id, 'new')}
                                    className={`btn ${selectedObjection.status === 'new' ? 'btn-warning' : 'btn-secondary'} py-2 px-4`}
                                >
                                    <Clock className="w-4 h-4" />
                                    جديد
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedObjection.id, 'reviewing')}
                                    className={`btn ${selectedObjection.status === 'reviewing' ? 'btn-info' : 'btn-secondary'} py-2 px-4`}
                                >
                                    <Eye className="w-4 h-4" />
                                    قيد المراجعة
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedObjection.id, 'accepted')}
                                    className={`btn ${selectedObjection.status === 'accepted' ? 'btn-success' : 'btn-secondary'} py-2 px-4`}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    مقبول
                                </button>
                                <button
                                    onClick={() => handleStatusChange(selectedObjection.id, 'rejected')}
                                    className={`btn ${selectedObjection.status === 'rejected' ? 'btn-error' : 'btn-secondary'} py-2 px-4`}
                                >
                                    <XCircle className="w-4 h-4" />
                                    مرفوض
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
