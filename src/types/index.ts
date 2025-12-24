// ==========================================
// أنواع قاعدة البيانات
// ==========================================

// إعدادات النظام
export interface Settings {
    id: number;
    isResultsOpen: boolean;
    countdownEnd: string | null;
    announcementText: string | null;
    updatedAt: string;
}

// أنواع الشهادات
export interface CertificateType {
    id: number;
    name: string;
    year: string;
    isActive: boolean;
}

// الأقسام
export interface Section {
    id: number;
    certificateTypeId: number;
    name: string;
    certificateType?: CertificateType;
}

// المواد الدراسية
export interface Subject {
    id: number;
    name: string;
    sectionId: number;
    maxGrade: number;
    minGrade: number; // الدرجة الدنيا للنجاح
    section?: Section;
}

// الطلاب
export interface Student {
    id: number;
    subscriptionNumber: string;
    fullName: string;
    sectionId: number;
    certificateTypeId: number;
    manualFail?: boolean; // رسوب يدوي
    createdAt: string;
    section?: Section;
    certificateType?: CertificateType;
}

// النتائج
export interface Result {
    id: number;
    studentId: number;
    subjectId: number;
    grade: number;
    createdAt: string;
    student?: Student;
    subject?: Subject;
}

// المشرفين
export interface Admin {
    id: number;
    username: string;
    passwordHash: string;
    lastLogin: string | null;
}

// الاعتراضات
export interface Objection {
    id: number;
    subscriptionNumber: string;
    fullName: string;
    sectionId: number;
    phone?: string;
    objectionText: string;
    status: 'new' | 'reviewing' | 'accepted' | 'rejected';
    adminNote?: string;
    createdAt: string;
}

// ==========================================
// أنواع الاستجابة من API
// ==========================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// نتيجة الطالب الكاملة
export interface StudentResult {
    student: Student;
    results: {
        subject: Subject;
        grade: number;
        percentage: number;
    }[];
    totalGrade: number;
    maxTotalGrade: number;
    percentage: number;
    passed: boolean;
}

// ==========================================
// أنواع الطلبات
// ==========================================

// تسجيل الدخول
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    admin: {
        id: number;
        username: string;
    };
}

// بحث النتائج
export interface SearchResultRequest {
    subscriptionNumber: string;
}

// إضافة طالب
export interface CreateStudentRequest {
    subscriptionNumber: string;
    fullName: string;
    sectionId: number;
    certificateTypeId: number;
}

// إضافة نتيجة
export interface CreateResultRequest {
    studentId: number;
    subjectId: number;
    grade: number;
}

// تحديث الإعدادات
export interface UpdateSettingsRequest {
    isResultsOpen?: boolean;
    countdownEnd?: string | null;
    announcementText?: string | null;
}

// رفع ملف Excel/CSV
export interface UploadResult {
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: {
        row: number;
        message: string;
    }[];
}

// ==========================================
// أنواع مساعدة للواجهة
// ==========================================

// حالة المؤقت
export interface CountdownState {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

// عنصر القائمة الجانبية
export interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    badge?: number;
}

// إشعار
export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

// حالة التحميل
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ==========================================
// ثوابت
// ==========================================

export const CERTIFICATE_SECTIONS = {
    SCIENTIFIC: 'علمي',
    LITERARY: 'أدبي',
    PROFESSIONAL: 'مهني',
    INDUSTRIAL: 'صناعي',
    COMMERCIAL: 'تجاري',
    WOMENS: 'نسوي',
} as const;

export const PASSING_PERCENTAGE = 50;

export const GRADE_COLORS = {
    excellent: '#10b981', // 90-100
    veryGood: '#22c55e', // 80-89
    good: '#84cc16', // 70-79
    acceptable: '#eab308', // 60-69
    pass: '#f59e0b', // 50-59
    fail: '#ef4444', // < 50
} as const;

export function getGradeColor(percentage: number): string {
    if (percentage >= 90) return GRADE_COLORS.excellent;
    if (percentage >= 80) return GRADE_COLORS.veryGood;
    if (percentage >= 70) return GRADE_COLORS.good;
    if (percentage >= 60) return GRADE_COLORS.acceptable;
    if (percentage >= 50) return GRADE_COLORS.pass;
    return GRADE_COLORS.fail;
}

export function getGradeLabel(percentage: number): string {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    if (percentage >= 50) return 'ناجح';
    return 'راسب';
}
