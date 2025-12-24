import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedRow {
    subscriptionNumber: string;
    fullName: string;
    section: string;
    grades: { [subject: string]: number };
}

export interface ParseResult {
    success: boolean;
    data: ParsedRow[];
    errors: string[];
    headers: string[];
}

/**
 * قراءة ملف Excel
 */
export function parseExcelFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // أخذ أول ورقة
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // تحويل إلى JSON
                const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    resolve({
                        success: false,
                        data: [],
                        errors: ['الملف فارغ أو لا يحتوي على بيانات كافية'],
                        headers: [],
                    });
                    return;
                }

                // الصف الأول = العناوين
                const firstRow = jsonData[0] as unknown[];
                const headers = firstRow.map(h => String(h || '').trim());

                // التحقق من الأعمدة المطلوبة
                const requiredColumns = ['رقم الاكتتاب', 'الاسم الكامل', 'القسم'];
                const missingColumns = requiredColumns.filter(col => !headers.includes(col));

                if (missingColumns.length > 0) {
                    resolve({
                        success: false,
                        data: [],
                        errors: [`الأعمدة التالية مطلوبة: ${missingColumns.join(', ')}`],
                        headers,
                    });
                    return;
                }

                // العثور على فهارس الأعمدة
                const subscriptionIndex = headers.indexOf('رقم الاكتتاب');
                const nameIndex = headers.indexOf('الاسم الكامل');
                const sectionIndex = headers.indexOf('القسم');

                // أعمدة الدرجات (كل ما عدا الأعمدة المطلوبة)
                const gradeColumns = headers.filter(h => !requiredColumns.includes(h) && h);

                const parsedRows: ParsedRow[] = [];
                const errors: string[] = [];

                // معالجة الصفوف
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];

                    if (!row || row.length === 0) continue;

                    const subscriptionNumber = String(row[subscriptionIndex] || '').trim();
                    const fullName = String(row[nameIndex] || '').trim();
                    const section = String(row[sectionIndex] || '').trim();

                    if (!subscriptionNumber || !fullName) {
                        errors.push(`الصف ${i + 1}: بيانات ناقصة`);
                        continue;
                    }

                    // جمع الدرجات
                    const grades: { [subject: string]: number } = {};
                    for (const col of gradeColumns) {
                        const colIndex = headers.indexOf(col);
                        if (colIndex !== -1 && row[colIndex] !== undefined) {
                            const grade = parseFloat(String(row[colIndex]));
                            if (!isNaN(grade)) {
                                grades[col] = grade;
                            }
                        }
                    }

                    parsedRows.push({
                        subscriptionNumber,
                        fullName,
                        section,
                        grades,
                    });
                }

                resolve({
                    success: true,
                    data: parsedRows,
                    errors,
                    headers,
                });
            } catch (error) {
                resolve({
                    success: false,
                    data: [],
                    errors: [`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
                    headers: [],
                });
            }
        };

        reader.onerror = () => {
            resolve({
                success: false,
                data: [],
                errors: ['فشل في قراءة الملف'],
                headers: [],
            });
        };

        reader.readAsArrayBuffer(file);
    });
}

/**
 * قراءة ملف CSV
 */
export function parseCSVFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
        Papa.parse(file, {
            complete: (results) => {
                try {
                    const data = results.data as string[][];

                    if (data.length < 2) {
                        resolve({
                            success: false,
                            data: [],
                            errors: ['الملف فارغ أو لا يحتوي على بيانات كافية'],
                            headers: [],
                        });
                        return;
                    }

                    // الصف الأول = العناوين
                    const headers = data[0].map(h => String(h || '').trim());

                    // التحقق من الأعمدة المطلوبة
                    const requiredColumns = ['رقم الاكتتاب', 'الاسم الكامل', 'القسم'];
                    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

                    if (missingColumns.length > 0) {
                        resolve({
                            success: false,
                            data: [],
                            errors: [`الأعمدة التالية مطلوبة: ${missingColumns.join(', ')}`],
                            headers,
                        });
                        return;
                    }

                    // العثور على فهارس الأعمدة
                    const subscriptionIndex = headers.indexOf('رقم الاكتتاب');
                    const nameIndex = headers.indexOf('الاسم الكامل');
                    const sectionIndex = headers.indexOf('القسم');

                    // أعمدة الدرجات
                    const gradeColumns = headers.filter(h => !requiredColumns.includes(h) && h);

                    const parsedRows: ParsedRow[] = [];
                    const errors: string[] = [];

                    // معالجة الصفوف
                    for (let i = 1; i < data.length; i++) {
                        const row = data[i];

                        if (!row || row.every(cell => !cell)) continue;

                        const subscriptionNumber = String(row[subscriptionIndex] || '').trim();
                        const fullName = String(row[nameIndex] || '').trim();
                        const section = String(row[sectionIndex] || '').trim();

                        if (!subscriptionNumber || !fullName) {
                            errors.push(`الصف ${i + 1}: بيانات ناقصة`);
                            continue;
                        }

                        // جمع الدرجات
                        const grades: { [subject: string]: number } = {};
                        for (const col of gradeColumns) {
                            const colIndex = headers.indexOf(col);
                            if (colIndex !== -1 && row[colIndex]) {
                                const grade = parseFloat(row[colIndex]);
                                if (!isNaN(grade)) {
                                    grades[col] = grade;
                                }
                            }
                        }

                        parsedRows.push({
                            subscriptionNumber,
                            fullName,
                            section,
                            grades,
                        });
                    }

                    resolve({
                        success: true,
                        data: parsedRows,
                        errors,
                        headers,
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        data: [],
                        errors: [`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
                        headers: [],
                    });
                }
            },
            error: (error) => {
                resolve({
                    success: false,
                    data: [],
                    errors: [`خطأ في قراءة الملف: ${error.message}`],
                    headers: [],
                });
            },
            encoding: 'UTF-8',
        });
    });
}

/**
 * تحديد نوع الملف ومعالجته
 */
export async function parseFile(file: File): Promise<ParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx' || extension === 'xls') {
        return parseExcelFile(file);
    } else if (extension === 'csv') {
        return parseCSVFile(file);
    } else {
        return {
            success: false,
            data: [],
            errors: ['نوع الملف غير مدعوم. يرجى استخدام Excel (.xlsx, .xls) أو CSV (.csv)'],
            headers: [],
        };
    }
}

/**
 * إنشاء ملف Excel نموذجي
 */
export function generateTemplateExcel(): Blob {
    const headers = [
        'رقم الاكتتاب',
        'الاسم الكامل',
        'القسم',
        'الرياضيات',
        'الفيزياء',
        'الكيمياء',
        'اللغة العربية',
        'اللغة الأجنبية',
        'التربية الوطنية',
        'التربية الدينية',
    ];

    const sampleData = [
        ['123456', 'عمر زين الدين', 'علمي', 280, 180, 175, 185, 170, 90, 95],
        ['123457', 'خالد نكد', 'علمي', 295, 195, 190, 180, 185, 95, 98],
        ['123458', 'يوسف شقير', 'مهني', '', '', '', 290, 175, 92, 94],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'النتائج');

    // ضبط عرض الأعمدة
    worksheet['!cols'] = headers.map(() => ({ wch: 15 }));

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
