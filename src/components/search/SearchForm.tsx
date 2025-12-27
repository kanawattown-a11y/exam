'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { isValidSubscriptionNumber, sanitizeSubscriptionNumber } from '@/lib/utils';

interface SearchFormProps {
    onSearch: (subscriptionNumber: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

export default function SearchForm({ onSearch, isLoading = false, error = null }: SearchFormProps) {
    const [value, setValue] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const sanitized = sanitizeSubscriptionNumber(value);

        if (!sanitized) {
            setValidationError('يرجى إدخال رقم الاكتتاب');
            return;
        }

        if (!isValidSubscriptionNumber(sanitized)) {
            setValidationError('رقم الاكتتاب يجب أن يكون من 4 إلى 20 رقم');
            return;
        }

        setValidationError(null);
        onSearch(sanitized);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        // السماح فقط بالأرقام
        if (/^\d*$/.test(newValue)) {
            setValue(newValue);
            setValidationError(null);
        }
    };

    const displayError = validationError || error;

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto px-4">
            {/* العنوان */}
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    <span className="gradient-text">البحث عن النتيجة</span>
                </h2>
                <p className="text-dark-400">
                    أدخل رقم الاكتتاب للحصول على نتيجتك
                </p>
            </div>

            {/* حقل البحث */}
            <div className="relative group">
                {/* الخلفية المتوهجة */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative glass-strong rounded-2xl p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* صف البحث */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* أيقونة البحث */}
                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                            </div>

                            {/* حقل الإدخال */}
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={value}
                                onChange={handleChange}
                                placeholder="أدخل رقم الاكتتاب..."
                                disabled={isLoading}
                                className="flex-1 min-w-0 bg-transparent text-base sm:text-lg md:text-xl text-white placeholder-dark-400 outline-none px-2 py-2 sm:py-3 disabled:opacity-50"
                                autoComplete="off"
                                dir="ltr"
                            />
                        </div>

                        {/* زر البحث */}
                        <button
                            type="submit"
                            disabled={isLoading || !value}
                            className="flex-shrink-0 btn-primary w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'بحث'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* رسالة الخطأ */}
            {displayError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center fade-in">
                    <span>⚠️</span> {displayError}
                </div>
            )}

            {/* تعليمات */}
            <div className="mt-6 text-center text-dark-500 text-sm">
                <p>رقم الاكتتاب موجود في بطاقة الامتحان الخاصة بك</p>
            </div>
        </form>
    );
}
