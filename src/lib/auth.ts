// ==========================================
// نظام مصادقة الأدمن
// ==========================================

import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'jabal-bashan-exam-results-secret-key-2024'
);

const ADMIN_STORAGE_KEY = 'exam_admin';
const AUTH_TOKEN_KEY = 'exam_auth_token';

// بيانات الأدمن الافتراضية
const DEFAULT_ADMIN = {
    id: 1,
    username: 'admin',
    // كلمة المرور الافتراضية: Bashan@2025!Security
    passwordHash: 'default_strong_password',
    lastLogin: null as string | null,
};

interface Admin {
    id: number;
    username: string;
    passwordHash: string;
    lastLogin: string | null;
}

interface JWTPayload {
    adminId: number;
    username: string;
    iat: number;
    exp: number;
}

// ==========================================
// دوال قاعدة البيانات
// ==========================================

function getAdmin(): Admin {
    if (typeof window === 'undefined') return DEFAULT_ADMIN;
    try {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_ADMIN;
    } catch {
        return DEFAULT_ADMIN;
    }
}

function updateAdmin(updates: Partial<Admin>): Admin {
    const admin = getAdmin();
    const updated = { ...admin, ...updates };
    if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
}

// ==========================================
// دوال المصادقة
// ==========================================

/**
 * تشفير كلمة المرور
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * إنشاء رمز JWT
 */
export async function generateToken(adminId: number, username: string): Promise<string> {
    const token = await new jose.SignJWT({ adminId, username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(SECRET_KEY);

    return token;
}

/**
 * التحقق من صحة الرمز
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, SECRET_KEY);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * تسجيل الدخول
 */
export async function login(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
}> {
    const admin = getAdmin();

    // التحقق من اسم المستخدم
    if (admin.username !== username) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // التحقق من كلمة المرور
    let isValid = false;

    // للتطوير: نقبل كلمة المرور الافتراضية الجديدة
    if (password === 'Bashan@2025!Security' && admin.passwordHash === 'default_strong_password') {
        isValid = true;
    } else {
        try {
            isValid = await verifyPassword(password, admin.passwordHash);
        } catch {
            // في حالة فشل التحقق، جرب كلمة المرور الافتراضية (للتوافق)
            if (password === 'Bashan@2025!Security') {
                isValid = true;
            }
        }
    }

    if (!isValid) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // تحديث آخر تسجيل دخول
    updateAdmin({ lastLogin: new Date().toISOString() });

    // إنشاء الرمز
    const token = await generateToken(admin.id, admin.username);

    // حفظ الرمز في localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    return { success: true, token };
}

/**
 * تسجيل الخروج
 */
export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }
}

/**
 * الحصول على الرمز المحفوظ
 */
export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * التحقق من حالة تسجيل الدخول
 */
export async function isAuthenticated(): Promise<boolean> {
    const token = getStoredToken();
    if (!token) return false;

    const payload = await verifyToken(token);
    return payload !== null;
}

/**
 * الحصول على معلومات الأدمن الحالي
 */
export async function getCurrentAdmin(): Promise<{
    id: number;
    username: string;
} | null> {
    const token = getStoredToken();
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
        id: payload.adminId,
        username: payload.username,
    };
}

/**
 * تغيير كلمة المرور - معطل حالياً بطلب من المستخدم
 */
export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'تغيير كلمة المرور غير متاح حالياً' };
}

/**
 * تهيئة بيانات الأدمن الافتراضية
 */
export function initializeAdmin(): void {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(ADMIN_STORAGE_KEY)) {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN));
    }
}
