import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'نتائج الامتحانات - جبل باشان',
    description: 'منصة عرض نتائج الامتحانات الرسمية في جبل باشان',
    keywords: ['نتائج', 'امتحانات', 'جبل باشان', 'شهادة ثانوية', 'درجات'],
    authors: [{ name: 'جبل باشان' }],
    openGraph: {
        title: 'نتائج الامتحانات - جبل باشان',
        description: 'منصة عرض نتائج الامتحانات الرسمية في جبل باشان',
        locale: 'ar_SY',
        type: 'website',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 5,
        userScalable: true,
    },
    themeColor: '#4788c8',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/logo.jpg" type="image/jpeg" />
                <link rel="apple-touch-icon" href="/logo.jpg" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="min-h-screen gradient-bg" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
