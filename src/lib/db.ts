'use server';

import turso from './turso';
import type {
    Settings,
    CertificateType,
    Section,
    Subject,
    Student,
    Result,
    StudentResult,
    ApiResponse,
    Objection
} from '@/types';
import { calculatePercentage, isPassing } from '@/lib/utils';

const PASSING_PERCENTAGE = 50;

// ==========================================
// قاعدة بيانات Turso (Cloud)
// للإنتاج مع دعم آلاف الطلاب
// ==========================================

// ==========================================
// الإعدادات
// ==========================================

export async function getSettings(): Promise<Settings> {
    try {
        const result = await turso.execute('SELECT * FROM settings WHERE id = 1');
        if (result.rows.length === 0) {
            return {
                id: 1,
                isResultsOpen: false,
                countdownEnd: null,
                announcementText: null,
                updatedAt: new Date().toISOString(),
            };
        }
        const row = result.rows[0];
        return {
            id: row.id as number,
            isResultsOpen: Boolean(row.is_results_open),
            countdownEnd: row.countdown_end as string | null,
            announcementText: row.announcement_text as string | null,
            updatedAt: row.updated_at as string || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error fetching settings:', error);
        // إرجاع إعدادات افتراضية في حالة الفشل لتجنب انهيار الصفحة
        return {
            id: 1,
            isResultsOpen: false,
            countdownEnd: null,
            announcementText: '⚠️ نعتذر، هناك مشكلة في الاتصال بقاعدة البيانات حالياً.',
            updatedAt: new Date().toISOString(),
        };
    }
}

export async function updateSettings(data: Partial<Settings>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const args: (string | number | null)[] = [];

        if (data.isResultsOpen !== undefined) {
            updates.push('is_results_open = ?');
            args.push(data.isResultsOpen ? 1 : 0);
        }
        if (data.countdownEnd !== undefined) {
            updates.push('countdown_end = ?');
            args.push(data.countdownEnd);
        }
        if (data.announcementText !== undefined) {
            updates.push('announcement_text = ?');
            args.push(data.announcementText);
        }

        updates.push("updated_at = datetime('now')");

        if (updates.length > 0) {
            await turso.execute({
                sql: `UPDATE settings SET ${updates.join(', ')} WHERE id = 1`,
                args,
            });
        }
        return true;
    } catch (error) {
        console.error('Error updating settings:', error);
        return false;
    }
}

// ==========================================
// أنواع الشهادات
// ==========================================

export async function getCertificateTypes(): Promise<CertificateType[]> {
    const result = await turso.execute('SELECT * FROM certificate_types ORDER BY year DESC');
    return result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        year: String(row.year),
        isActive: Boolean(row.is_active ?? 1),
    }));
}

export async function addCertificateType(data: Omit<CertificateType, 'id'>): Promise<CertificateType> {
    const result = await turso.execute({
        sql: 'INSERT INTO certificate_types (name, year, is_active) VALUES (?, ?, ?) RETURNING *',
        args: [data.name, data.year, data.isActive ? 1 : 0],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        name: row.name as string,
        year: String(row.year),
        isActive: Boolean(row.is_active ?? 1),
    };
}

// ==========================================
// الأقسام
// ==========================================

export async function getSections(): Promise<Section[]> {
    const result = await turso.execute(`
        SELECT s.*, ct.name as cert_name, ct.year as cert_year, ct.is_active as cert_active
        FROM sections s
        LEFT JOIN certificate_types ct ON s.certificate_type_id = ct.id
        ORDER BY s.id
    `);
    return result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        certificateTypeId: row.certificate_type_id as number,
        certificateType: row.cert_name ? {
            id: row.certificate_type_id as number,
            name: row.cert_name as string,
            year: String(row.cert_year),
            isActive: Boolean(row.cert_active ?? 1),
        } : undefined,
    }));
}

export async function addSection(data: Omit<Section, 'id'>): Promise<Section> {
    const result = await turso.execute({
        sql: 'INSERT INTO sections (name, certificate_type_id) VALUES (?, ?) RETURNING *',
        args: [data.name, data.certificateTypeId],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        name: row.name as string,
        certificateTypeId: row.certificate_type_id as number,
    };
}

export async function updateSection(id: number, data: Partial<Section>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (data.name) { updates.push('name = ?'); args.push(data.name); }
        if (data.certificateTypeId) { updates.push('certificate_type_id = ?'); args.push(data.certificateTypeId); }

        if (updates.length > 0) {
            args.push(id);
            await turso.execute({
                sql: `UPDATE sections SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteSection(id: number): Promise<boolean> {
    try {
        await turso.execute({ sql: 'DELETE FROM sections WHERE id = ?', args: [id] });
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// المواد
// ==========================================

export async function getSubjects(): Promise<Subject[]> {
    const result = await turso.execute(`
        SELECT sub.*, sec.name as section_name, sec.certificate_type_id
        FROM subjects sub 
        LEFT JOIN sections sec ON sub.section_id = sec.id 
        ORDER BY sub.section_id, sub.id
    `);
    return result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        sectionId: row.section_id as number,
        maxGrade: row.max_grade as number,
        minGrade: row.min_grade as number,
        section: row.section_name ? {
            id: row.section_id as number,
            name: row.section_name as string,
            certificateTypeId: row.certificate_type_id as number,
        } : undefined,
    }));
}

export async function getSubjectsBySectionId(sectionId: number): Promise<Subject[]> {
    const result = await turso.execute({
        sql: 'SELECT * FROM subjects WHERE section_id = ? ORDER BY id',
        args: [sectionId],
    });
    return result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        sectionId: row.section_id as number,
        maxGrade: row.max_grade as number,
        minGrade: row.min_grade as number,
    }));
}

export async function addSubject(data: Omit<Subject, 'id'>): Promise<Subject> {
    const result = await turso.execute({
        sql: 'INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES (?, ?, ?, ?) RETURNING *',
        args: [data.name, data.sectionId, data.maxGrade, data.minGrade || Math.floor(data.maxGrade * 0.5)],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        name: row.name as string,
        sectionId: row.section_id as number,
        maxGrade: row.max_grade as number,
        minGrade: row.min_grade as number,
    };
}

export async function updateSubject(id: number, data: Partial<Subject>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (data.name) { updates.push('name = ?'); args.push(data.name); }
        if (data.sectionId) { updates.push('section_id = ?'); args.push(data.sectionId); }
        if (data.maxGrade) { updates.push('max_grade = ?'); args.push(data.maxGrade); }
        if (data.minGrade !== undefined) { updates.push('min_grade = ?'); args.push(data.minGrade); }

        if (updates.length > 0) {
            args.push(id);
            await turso.execute({
                sql: `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteSubject(id: number): Promise<boolean> {
    try {
        await turso.execute({ sql: 'DELETE FROM subjects WHERE id = ?', args: [id] });
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// الطلاب
// ==========================================

export async function getStudents(): Promise<Student[]> {
    const result = await turso.execute(`
        SELECT s.*, 
               sec.name as section_name, sec.certificate_type_id as sec_cert_id,
               ct.name as cert_name, ct.year as cert_year, ct.is_active as cert_active
        FROM students s
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN certificate_types ct ON s.certificate_type_id = ct.id
        ORDER BY s.id DESC
    `);
    return result.rows.map(row => ({
        id: row.id as number,
        subscriptionNumber: row.subscription_number as string,
        fullName: row.full_name as string,
        sectionId: row.section_id as number,
        certificateTypeId: row.certificate_type_id as number,
        manualFail: Boolean(row.manual_fail),
        createdAt: row.created_at as string,
        section: row.section_name ? {
            id: row.section_id as number,
            name: row.section_name as string,
            certificateTypeId: row.sec_cert_id as number,
        } : undefined,
        certificateType: row.cert_name ? {
            id: row.certificate_type_id as number,
            name: row.cert_name as string,
            year: String(row.cert_year),
            isActive: Boolean(row.cert_active ?? 1),
        } : undefined,
    }));
}

export async function getStudentBySubscriptionNumber(subscriptionNumber: string): Promise<Student | undefined> {
    const result = await turso.execute({
        sql: `
            SELECT s.*, 
                   sec.name as section_name, sec.certificate_type_id as sec_cert_id,
                   ct.name as cert_name, ct.year as cert_year, ct.is_active as cert_active
            FROM students s
            LEFT JOIN sections sec ON s.section_id = sec.id
            LEFT JOIN certificate_types ct ON s.certificate_type_id = ct.id
            WHERE s.subscription_number = ?
        `,
        args: [subscriptionNumber],
    });
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
        id: row.id as number,
        subscriptionNumber: row.subscription_number as string,
        fullName: row.full_name as string,
        sectionId: row.section_id as number,
        certificateTypeId: row.certificate_type_id as number,
        manualFail: Boolean(row.manual_fail),
        createdAt: row.created_at as string,
        section: row.section_name ? {
            id: row.section_id as number,
            name: row.section_name as string,
            certificateTypeId: row.sec_cert_id as number,
        } : undefined,
        certificateType: row.cert_name ? {
            id: row.certificate_type_id as number,
            name: row.cert_name as string,
            year: String(row.cert_year),
            isActive: Boolean(row.cert_active ?? 1),
        } : undefined,
    };
}

export async function addStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    const result = await turso.execute({
        sql: `INSERT INTO students (subscription_number, full_name, section_id, certificate_type_id, manual_fail) 
              VALUES (?, ?, ?, ?, ?) RETURNING *`,
        args: [data.subscriptionNumber, data.fullName, data.sectionId, data.certificateTypeId, data.manualFail ? 1 : 0],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        subscriptionNumber: row.subscription_number as string,
        fullName: row.full_name as string,
        sectionId: row.section_id as number,
        certificateTypeId: row.certificate_type_id as number,
        manualFail: Boolean(row.manual_fail),
        createdAt: row.created_at as string,
    };
}

export async function updateStudent(id: number, data: Partial<Student>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const args: (string | number)[] = [];

        if (data.subscriptionNumber) { updates.push('subscription_number = ?'); args.push(data.subscriptionNumber); }
        if (data.fullName) { updates.push('full_name = ?'); args.push(data.fullName); }
        if (data.sectionId) { updates.push('section_id = ?'); args.push(data.sectionId); }
        if (data.certificateTypeId) { updates.push('certificate_type_id = ?'); args.push(data.certificateTypeId); }
        if (data.manualFail !== undefined) { updates.push('manual_fail = ?'); args.push(data.manualFail ? 1 : 0); }

        if (updates.length > 0) {
            args.push(id);
            await turso.execute({
                sql: `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteStudent(id: number): Promise<boolean> {
    try {
        await turso.execute({ sql: 'DELETE FROM students WHERE id = ?', args: [id] });
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// النتائج
// ==========================================

export async function getResults(): Promise<Result[]> {
    const result = await turso.execute('SELECT * FROM results ORDER BY id DESC');
    return result.rows.map(row => ({
        id: row.id as number,
        studentId: row.student_id as number,
        subjectId: row.subject_id as number,
        grade: row.grade as number,
        createdAt: row.created_at as string,
    }));
}

export async function getResultsByStudentId(studentId: number): Promise<Result[]> {
    const result = await turso.execute({
        sql: 'SELECT * FROM results WHERE student_id = ?',
        args: [studentId],
    });
    return result.rows.map(row => ({
        id: row.id as number,
        studentId: row.student_id as number,
        subjectId: row.subject_id as number,
        grade: row.grade as number,
        createdAt: row.created_at as string,
    }));
}

export async function addResult(data: Omit<Result, 'id' | 'createdAt'>): Promise<Result> {
    const result = await turso.execute({
        sql: 'INSERT INTO results (student_id, subject_id, grade) VALUES (?, ?, ?) RETURNING *',
        args: [data.studentId, data.subjectId, data.grade],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        studentId: row.student_id as number,
        subjectId: row.subject_id as number,
        grade: row.grade as number,
        createdAt: row.created_at as string,
    };
}

export async function updateResult(id: number, data: Partial<Result>): Promise<boolean> {
    try {
        if (data.grade !== undefined) {
            await turso.execute({
                sql: 'UPDATE results SET grade = ? WHERE id = ?',
                args: [data.grade, id],
            });
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteResult(id: number): Promise<boolean> {
    try {
        await turso.execute({ sql: 'DELETE FROM results WHERE id = ?', args: [id] });
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// نتائج الطالب الكاملة
// ==========================================

export async function getStudentFullResult(subscriptionNumber: string): Promise<ApiResponse<StudentResult>> {
    const settings = await getSettings();

    if (!settings.isResultsOpen) {
        return {
            success: false,
            error: 'النتائج غير متاحة حالياً',
        };
    }

    const student = await getStudentBySubscriptionNumber(subscriptionNumber);
    if (!student) {
        return {
            success: false,
            error: 'رقم الاكتتاب غير موجود',
        };
    }

    const subjects = await getSubjectsBySectionId(student.sectionId);
    const results = await getResultsByStudentId(student.id);

    // تجميع النتائج
    let hasFailedSubject = false;
    const subjectResults = subjects.map(subject => {
        const result = results.find(r => r.subjectId === subject.id);
        const grade = result?.grade || 0;

        const minGrade = subject.minGrade || Math.floor(subject.maxGrade * 0.5);
        if (grade < minGrade) {
            hasFailedSubject = true;
        }

        return {
            subject,
            grade,
            percentage: calculatePercentage(grade, subject.maxGrade),
        };
    });

    const totalGrade = subjectResults.reduce((sum, r) => sum + r.grade, 0);
    const maxTotalGrade = subjects.reduce((sum, s) => sum + s.maxGrade, 0);
    const percentage = calculatePercentage(totalGrade, maxTotalGrade);

    const passed = !student.manualFail && !hasFailedSubject && isPassing(percentage, PASSING_PERCENTAGE);

    return {
        success: true,
        data: {
            student,
            results: subjectResults,
            totalGrade,
            maxTotalGrade,
            percentage,
            passed,
        },
    };
}

// ==========================================
// المصادقة
// ==========================================

export async function verifyAdmin(username: string, password: string): Promise<boolean> {
    const result = await turso.execute({
        sql: 'SELECT * FROM admins WHERE username = ? AND password_hash = ?',
        args: [username, password],
    });
    if (result.rows.length > 0) {
        await turso.execute({
            sql: "UPDATE admins SET last_login = datetime('now') WHERE username = ?",
            args: [username],
        });
        return true;
    }
    return false;
}

// ==========================================
// الاعتراضات
// ==========================================

export async function getObjections(): Promise<Objection[]> {
    const result = await turso.execute('SELECT * FROM objections ORDER BY created_at DESC');
    return result.rows.map(row => ({
        id: row.id as number,
        subscriptionNumber: row.subscription_number as string,
        fullName: row.full_name as string,
        sectionId: row.section_id as number,
        phone: row.phone as string | undefined,
        objectionText: row.objection_text as string,
        status: row.status as Objection['status'],
        adminNote: row.admin_note as string | undefined,
        createdAt: row.created_at as string,
    }));
}

export async function addObjection(data: Omit<Objection, 'id' | 'createdAt' | 'status'>): Promise<Objection> {
    const result = await turso.execute({
        sql: `INSERT INTO objections (subscription_number, full_name, section_id, phone, objection_text, status) 
              VALUES (?, ?, ?, ?, ?, 'new') RETURNING *`,
        args: [data.subscriptionNumber, data.fullName, data.sectionId, data.phone || null, data.objectionText],
    });
    const row = result.rows[0];
    return {
        id: row.id as number,
        subscriptionNumber: row.subscription_number as string,
        fullName: row.full_name as string,
        sectionId: row.section_id as number,
        phone: row.phone as string | undefined,
        objectionText: row.objection_text as string,
        status: row.status as Objection['status'],
        adminNote: row.admin_note as string | undefined,
        createdAt: row.created_at as string,
    };
}

export async function updateObjection(id: number, data: Partial<Objection>): Promise<boolean> {
    try {
        const updates: string[] = [];
        const args: (string | number | null)[] = [];

        if (data.status) { updates.push('status = ?'); args.push(data.status); }
        if (data.adminNote !== undefined) { updates.push('admin_note = ?'); args.push(data.adminNote || null); }

        if (updates.length > 0) {
            args.push(id);
            await turso.execute({
                sql: `UPDATE objections SET ${updates.join(', ')} WHERE id = ?`,
                args,
            });
        }
        return true;
    } catch {
        return false;
    }
}

export async function deleteObjection(id: number): Promise<boolean> {
    try {
        await turso.execute({ sql: 'DELETE FROM objections WHERE id = ?', args: [id] });
        return true;
    } catch {
        return false;
    }
}

// ==========================================
// دوال الاستيراد الجماعي
// ==========================================

export async function bulkAddStudents(students: Omit<Student, 'id' | 'createdAt'>[]): Promise<{
    success: number;
    errors: string[];
}> {
    let success = 0;
    const errors: string[] = [];

    for (const student of students) {
        try {
            await turso.execute({
                sql: `INSERT INTO students (subscription_number, full_name, section_id, certificate_type_id, manual_fail) 
                      VALUES (?, ?, ?, ?, ?)`,
                args: [student.subscriptionNumber, student.fullName, student.sectionId, student.certificateTypeId, student.manualFail ? 1 : 0],
            });
            success++;
        } catch (error) {
            errors.push(`خطأ في إضافة الطالب ${student.subscriptionNumber}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }

    return { success, errors };
}

export async function bulkAddResults(results: Omit<Result, 'id' | 'createdAt'>[]): Promise<{
    success: number;
    errors: string[];
}> {
    let success = 0;
    const errors: string[] = [];

    for (const result of results) {
        try {
            // التحقق من عدم وجود نتيجة سابقة
            const existing = await turso.execute({
                sql: 'SELECT id FROM results WHERE student_id = ? AND subject_id = ?',
                args: [result.studentId, result.subjectId],
            });

            if (existing.rows.length > 0) {
                // تحديث النتيجة الموجودة
                await turso.execute({
                    sql: 'UPDATE results SET grade = ? WHERE student_id = ? AND subject_id = ?',
                    args: [result.grade, result.studentId, result.subjectId],
                });
            } else {
                // إضافة نتيجة جديدة
                await turso.execute({
                    sql: 'INSERT INTO results (student_id, subject_id, grade) VALUES (?, ?, ?)',
                    args: [result.studentId, result.subjectId, result.grade],
                });
            }
            success++;
        } catch (error) {
            errors.push(`خطأ في إضافة النتيجة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }

    return { success, errors };
}
