# 🚀 دليل النشر على Turso + Cloudflare

## نظرة عامة

| المكون | الخدمة | السعر |
|--------|--------|-------|
| قاعدة البيانات | Turso | مجاني (8GB) |
| الاستضافة | Cloudflare Pages | مجاني |
| الدومين | Cloudflare | مجاني (subdomain) |
| SSL | Cloudflare | مجاني |

---

## 📊 القدرات

| المقياس | القيمة |
|---------|--------|
| **الطلبات/ثانية** | 10,000+ |
| **المستخدمين المتزامنين** | 50,000+ |
| **عدد الطلاب** | غير محدود |
| **حجم البيانات** | 8 GB |

---

## الخطوة 1: إعداد Turso

### 1.1 إنشاء حساب
1. اذهب إلى [turso.tech](https://turso.tech)
2. سجل دخول بحساب GitHub

### 1.2 إنشاء قاعدة البيانات
```bash
# من Dashboard على الموقع:
# 1. اضغط "Create Database"
# 2. اسم: exam-results
# 3. Region: اختر الأقرب (مثل: fra - Frankfurt)
```

### 1.3 الحصول على بيانات الاتصال
من صفحة قاعدة البيانات:
1. **Database URL**: انسخ الـ URL (يبدأ بـ libsql://)
2. **Auth Token**: اضغط "Create Token" وانسخه

---

## الخطوة 2: إعداد المشروع

### 2.1 إنشاء ملف البيئة
أنشئ ملف `.env.local` في المشروع:

```env
TURSO_DATABASE_URL=libsql://exam-results-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQS...
NEXT_PUBLIC_APP_URL=https://your-site.pages.dev
```

### 2.2 تفعيل Turso
**مهم:** استبدل الاستيراد في الملفات من:
```typescript
import { ... } from '@/lib/db';
```
إلى:
```typescript
import { ... } from '@/lib/db-turso';
```

أو يمكنك إعادة تسمية الملفات:
```bash
# احتفظ بالنسخة المحلية
mv src/lib/db.ts src/lib/db-local.ts

# استخدم Turso كالأساسي
mv src/lib/db-turso.ts src/lib/db.ts
```

### 2.3 تهيئة قاعدة البيانات
أضف في أي صفحة (مرة واحدة فقط):
```typescript
import { initializeDatabase } from '@/lib/turso';

// في useEffect أو API route
await initializeDatabase();
```

---

## الخطوة 3: النشر على Cloudflare Pages

### 3.1 رفع المشروع على GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/exam-results.git
git push -u origin main
```

### 3.2 ربط Cloudflare Pages
1. اذهب إلى [pages.cloudflare.com](https://pages.cloudflare.com)
2. سجل دخول أو أنشئ حساب مجاني
3. اضغط **"Create a project"**
4. اختر **"Connect to Git"**
5. اربط حساب GitHub واختر المستودع

### 3.3 إعدادات البناء
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
```

### 3.4 متغيرات البيئة
في Cloudflare Pages > Settings > Environment variables:

| Variable | Value |
|----------|-------|
| `TURSO_DATABASE_URL` | libsql://exam-results-xxx.turso.io |
| `TURSO_AUTH_TOKEN` | eyJhbGciOiJFZERTQS... |
| `NODE_VERSION` | 18 |

### 3.5 النشر
اضغط **"Save and Deploy"**

---

## الخطوة 4: إعداد الدومين (اختياري)

### دومين مجاني من Cloudflare
سيكون موقعك على: `https://exam-results.pages.dev`

### دومين مخصص
1. في Cloudflare Pages > Custom domains
2. أضف الدومين الخاص بك
3. اتبع التعليمات لتغيير DNS

---

## 🔧 الأوامر المفيدة

```bash
# تطوير محلي
npm run dev

# بناء
npm run build

# اختبار البناء محلياً
npm start
```

---

## ✅ قائمة التحقق

- [ ] إنشاء حساب Turso
- [ ] إنشاء قاعدة بيانات
- [ ] نسخ URL و Token
- [ ] إنشاء .env.local
- [ ] تفعيل db-turso.ts
- [ ] تهيئة قاعدة البيانات
- [ ] رفع على GitHub
- [ ] ربط Cloudflare Pages
- [ ] إضافة متغيرات البيئة
- [ ] النشر!

---

## 🆘 حل المشاكل

### Error: TURSO_DATABASE_URL is not defined
تأكد من إضافة متغيرات البيئة في Cloudflare Pages.

### Error: Database not initialized
شغل `initializeDatabase()` مرة واحدة.

### الصور لا تظهر
تأكد من أن `next.config.js` يسمح بالـ images.

---

## 📞 الدعم

- [Turso Docs](https://docs.turso.tech)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)
- [Next.js Docs](https://nextjs.org/docs)
