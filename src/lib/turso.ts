import { createClient, type Client } from '@libsql/client/web';

// اتصال Turso - يتم تحميلة عند الطلب لتجنب أخطاء البناء
let tursoClient: Client | null = null;

export function getTursoClient(): Client {
    if (!tursoClient) {
        let url = process.env.TURSO_DATABASE_URL;
        if (!url) {
            // في حالة البناء أو نسيان المتغير، نرجع كائن وهمي لا يسبب انهيار التطبيق فوراً
            console.warn('⚠️ TURSO_DATABASE_URL is not set!');
            return createClient({ url: 'libsql://temp.turso.io' });
        }

        // تحويل الرابط إلى https إذا كان يبدأ بـ libsql لضمان التوافق مع متصفحات Edge
        if (url.startsWith('libsql://')) {
            url = url.replace('libsql://', 'https://');
        }

        tursoClient = createClient({
            url: url,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
    }
    return tursoClient;
}

// Proxy object to allow 'import turso from "./turso"' while remaining lazy
// This prevents crashes if process.env is not available during module load
const turso = {
    execute: (stmt: any) => getTursoClient().execute(stmt),
    batch: (stmts: any[], mode?: any) => getTursoClient().batch(stmts, mode),
    transaction: (mode?: any) => getTursoClient().transaction(mode),
    close: () => getTursoClient().close(),
} as Client;

export default turso;

// تهيئة قاعدة البيانات
export async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');

        // إنشاء الجداول
        await turso.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                is_results_open INTEGER DEFAULT 0,
                countdown_end TEXT,
                announcement_text TEXT,
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS certificate_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                year TEXT NOT NULL,
                is_active INTEGER DEFAULT 1
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS sections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                certificate_type_id INTEGER,
                FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id)
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                section_id INTEGER,
                max_grade INTEGER NOT NULL DEFAULT 100,
                min_grade INTEGER NOT NULL DEFAULT 50,
                FOREIGN KEY (section_id) REFERENCES sections(id)
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subscription_number TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                section_id INTEGER,
                certificate_type_id INTEGER,
                manual_fail INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (section_id) REFERENCES sections(id),
                FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id)
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER,
                subject_id INTEGER,
                grade REAL NOT NULL,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id)
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                last_login TEXT
            )
        `);

        await turso.execute(`
            CREATE TABLE IF NOT EXISTS objections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                subscription_number TEXT NOT NULL,
                full_name TEXT NOT NULL,
                section_id INTEGER,
                phone TEXT,
                objection_text TEXT NOT NULL,
                status TEXT DEFAULT 'new',
                admin_note TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (section_id) REFERENCES sections(id)
            )
        `);

        // إضافة البيانات الافتراضية
        await insertDefaultData();

        console.log('✅ Database initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        return false;
    }
}

// إضافة البيانات الافتراضية
async function insertDefaultData() {
    // التحقق من وجود إعدادات
    const settings = await turso.execute('SELECT * FROM settings WHERE id = 1');
    if (settings.rows.length === 0) {
        await turso.execute(`
            INSERT INTO settings (id, is_results_open, announcement_text) 
            VALUES (1, 0, 'مرحباً بكم في نظام نتائج الامتحانات')
        `);
    }

    // التحقق من وجود مشرف
    const admins = await turso.execute('SELECT * FROM admins LIMIT 1');
    if (admins.rows.length === 0) {
        await turso.execute({
            sql: 'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
            args: ['admin', 'admin123'],
        });
        console.log('✅ Admin created: admin / admin123');
    }

    // التحقق من وجود أنواع شهادات
    const certs = await turso.execute('SELECT * FROM certificate_types LIMIT 1');
    if (certs.rows.length === 0) {
        await turso.execute(`
            INSERT INTO certificate_types (name, year, is_active) 
            VALUES ('الثانوية العامة', '2024', 1)
        `);
    }

    // التحقق من وجود أقسام
    const sections = await turso.execute('SELECT * FROM sections LIMIT 1');
    if (sections.rows.length === 0) {
        const certResult = await turso.execute('SELECT id FROM certificate_types LIMIT 1');
        const certId = certResult.rows[0]?.id || 1;

        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('علمي', ?)", args: [certId] });
        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('أدبي', ?)", args: [certId] });
        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('مهني تجاري', ?)", args: [certId] });
        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('مهني نسوي', ?)", args: [certId] });
        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('مهني صناعي', ?)", args: [certId] });
        await turso.execute({ sql: "INSERT INTO sections (name, certificate_type_id) VALUES ('شرعي', ?)", args: [certId] });
        console.log('✅ Sections created');
    }

    // التحقق من وجود مواد
    const subjects = await turso.execute('SELECT * FROM subjects LIMIT 1');
    if (subjects.rows.length === 0) {
        // مواد القسم العلمي (id = 1)
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('الرياضيات', 1, 300, 150)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('الفيزياء', 1, 200, 100)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('الكيمياء', 1, 200, 100)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('اللغة العربية', 1, 400, 200)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('اللغة الأجنبية', 1, 200, 100)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('التربية الوطنية', 1, 100, 50)");
        await turso.execute("INSERT INTO subjects (name, section_id, max_grade, min_grade) VALUES ('التربية الدينية', 1, 100, 50)");
        console.log('✅ Subjects created');
    }
}
