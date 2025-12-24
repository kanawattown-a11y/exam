import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/turso';

export async function GET() {
    try {
        const success = await initializeDatabase();
        if (success) {
            return NextResponse.json({
                success: true,
                message: '✅ قاعدة البيانات جاهزة!'
            });
        } else {
            return NextResponse.json({
                success: false,
                message: '❌ فشل في تهيئة قاعدة البيانات'
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'خطأ غير معروف'
        }, { status: 500 });
    }
}
