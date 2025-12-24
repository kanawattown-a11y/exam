import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج الأصناف مع Tailwind - يحل تعارضات الأصناف
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * تنسيق الأرقام بالعربية
 */
export function formatArabicNumber(num: number): string {
    return num.toLocaleString('ar-SY');
}

/**
 * تنسيق النسبة المئوية
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * تنسيق التاريخ بالعربية
 */
export function formatArabicDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-SY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });
}

/**
 * تنسيق الوقت بالعربية
 */
export function formatArabicTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('ar-SY', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * تنسيق التاريخ والوقت معاً
 */
export function formatArabicDateTime(date: Date | string): string {
    return `${formatArabicDate(date)} - ${formatArabicTime(date)}`;
}

/**
 * حساب الفرق بين تاريخين
 */
export function getTimeDifference(targetDate: Date | string): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
    isExpired: boolean;
} {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalMs: diff, isExpired: false };
}

/**
 * تأخير التنفيذ
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * التحقق من صحة رقم الاكتتاب
 */
export function isValidSubscriptionNumber(value: string): boolean {
    // يجب أن يكون رقماً من 4-20 خانة
    return /^\d{4,20}$/.test(value);
}

/**
 * تنظيف رقم الاكتتاب
 */
export function sanitizeSubscriptionNumber(value: string): string {
    return value.replace(/\D/g, '').trim();
}

/**
 * حساب النسبة المئوية
 */
export function calculatePercentage(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
}

/**
 * التحقق من النجاح
 */
export function isPassing(percentage: number, passingRate: number = 50): boolean {
    return percentage >= passingRate;
}

/**
 * اختصار النص الطويل
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * توليد معرف فريد
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * نسخ النص للحافظة
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

/**
 * تحويل الأرقام الإنجليزية للعربية
 */
export function toArabicNumerals(str: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[0-9]/g, d => arabicNumerals[parseInt(d)]);
}

/**
 * تحويل الأرقام العربية للإنجليزية
 */
export function toEnglishNumerals(str: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, d => arabicNumerals.indexOf(d).toString());
}

/**
 * تنسيق حجم الملف
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * التحقق من نوع الملف
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return allowedTypes.includes(ext);
}

/**
 * إنشاء URL للتحميل
 */
export function createDownloadUrl(data: Blob, filename: string): void {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * ثوابت النجاح
 */
export const PASSING_PERCENTAGE = 50;

/**
 * ألوان التقديرات
 */
export const GRADE_COLORS = {
    excellent: '#10b981', // 90-100
    veryGood: '#22c55e', // 80-89
    good: '#84cc16', // 70-79
    acceptable: '#eab308', // 60-69
    pass: '#f59e0b', // 50-59
    fail: '#ef4444', // < 50
} as const;

/**
 * الحصول على لون التقدير
 */
export function getGradeColor(percentage: number): string {
    if (percentage >= 90) return GRADE_COLORS.excellent;
    if (percentage >= 80) return GRADE_COLORS.veryGood;
    if (percentage >= 70) return GRADE_COLORS.good;
    if (percentage >= 60) return GRADE_COLORS.acceptable;
    if (percentage >= 50) return GRADE_COLORS.pass;
    return GRADE_COLORS.fail;
}

/**
 * الحصول على تسمية التقدير
 */
export function getGradeLabel(percentage: number): string {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    if (percentage >= 50) return 'ناجح';
    return 'راسب';
}

