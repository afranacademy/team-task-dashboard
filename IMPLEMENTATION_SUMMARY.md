# خلاصه پیاده‌سازی Timeline و مدیریت تاریخ‌های Task

## فایل‌های تغییر یافته و ایجاد شده

### 1. **src/types/index.ts** ✅
- آپدیت `Task` interface:
  - تغییر `startDate: string` به `start_date?: string | null`
  - اضافه شدن `end_date?: string | null`
  - اضافه شدن `priority?: 'low' | 'medium' | 'high'`
- حالا Task type با database schema هماهنگ است

### 2. **src/App.tsx** ✅
- آپدیت `loadTasksForMember`:
  - حالا `start_date`, `end_date`, `priority` از database خوانده می‌شود
- آپدیت `handleAddTask`:
  - فیلدهای date فقط در صورت وجود ارسال می‌شوند (برای استفاده از DB defaults)
- آپدیت `handleAddProjectTask`:
  - پشتیبانی از `start_date`, `end_date`, `priority`
  - فیلدهای date فقط در صورت تنظیم توسط کاربر ارسال می‌شوند
- آپدیت `handleUpdateTask`:
  - پشتیبانی از آپدیت `start_date`, `end_date`, `priority`

### 3. **src/components/ProjectDetailView.tsx** ✅ (بازنویسی کامل)
- ساده‌سازی کامل component
- استفاده از state مشترک برای همه تب‌ها
- تفکیک تب‌ها به کامپوننت‌های جداگانه
- اضافه شدن `handleUpdateTaskDates` برای Timeline tab
- Props یکسان برای همه تب‌ها (Tasks, Board, Timeline)

### 4. **src/components/ProjectTasksTab.tsx** ✅ (جدید)
- جدا شده از ProjectDetailView
- نمایش "تمام کارهای پروژه" و "وظایف من در این پروژه"
- استفاده از state مشترک با سایر تب‌ها

### 5. **src/components/ProjectBoardTab.tsx** ✅ (جدید)
- جدا شده از ProjectDetailView
- Kanban board با 4 ستون:
  - وظایف امروز من (فقط کاربر جاری)
  - باید انجام بشه (To Do)
  - در حال انجام (In Progress)
  - انجام شده (Completed)
- Drag & drop برای تغییر status و date
- نمایش priority badge برای هر task
- استفاده از state مشترک

### 6. **src/components/ProjectTimelineTab.tsx** ✅ (جدید)
- تب Timeline به سبک Google Calendar
- ویژگی‌ها:
  - نمایش ماهانه با grid 7×6
  - نمایش تمام taskهای پروژه روی تقویم
  - Drag & drop برای جابجایی task به روز دیگر (با حفظ duration)
  - کلیک روی task برای ویرایش تاریخ شروع و پایان
  - کلیک روی روز برای ایجاد task جدید
  - رنگ‌بندی بر اساس status (سبز=تکمیل، آبی=در حال انجام، خاکستری=باید انجام بشه)
  - نمایش avatar اعضا روی هر task
  - هایلایت کردن امروز و آخر هفته‌ها
  - پشتیبانی کامل از RTL و تاریخ جلالی
- Helper functions:
  - `getEffectiveDates`: محاسبه تاریخ شروع و پایان واقعی
  - `taskCoversDay`: بررسی اینکه آیا task یک روز خاص را پوشش می‌دهد
  - `getStatusColor`: رنگ بر اساس status
  - `getPriorityColor/Label`: رنگ و label بر اساس priority

### 7. **src/components/AddProjectTaskDialog.tsx** ✅
- اضافه شدن فیلدهای جدید:
  - تاریخ شروع (اختیاری)
  - تاریخ پایان (اختیاری)
  - اولویت (بالا/متوسط/پایین)
- فقط فیلدهایی که کاربر set کرده ارسال می‌شوند
- نمایش تاریخ جلالی برای همه date fields

---

## نحوه کار

### جریان داده (Data Flow)

```
App.tsx (State مشترک)
    ↓
ProjectDetailView
    ↓
├── ProjectTasksTab ────→ نمایش لیست tasks
├── ProjectBoardTab ────→ Kanban board + drag & drop
└── ProjectTimelineTab ─→ Calendar view + drag & drop
```

همه تب‌ها از یک state مشترک استفاده می‌کنند که در `App.tsx` نگهداری می‌شود.

### مدیریت تاریخ‌ها

1. **Database**: 
   - `date` (NOT NULL) - تاریخ اصلی task
   - `start_date` (nullable) - تاریخ شروع
   - `end_date` (nullable) - تاریخ پایان
   - Trigger `set_task_dates_defaults()` مطمئن می‌شود همه فیلدها مقدار دارند

2. **Frontend**:
   - اگر کاربر date را set نکند، فیلد ارسال نمی‌شود → DB از default استفاده می‌کند
   - اگر `start_date` یا `end_date` null باشد، از `date` استفاده می‌شود
   - در Timeline: `effectiveStart = start_date ?? date`, `effectiveEnd = end_date ?? start_date ?? date`

### Drag & Drop در Timeline

1. کاربر task را می‌کشد
2. روی روز جدید drop می‌کند
3. Duration محاسبه می‌شود: `duration = end - start`
4. تاریخ‌های جدید محاسبه می‌شوند: `newEnd = newStart + duration`
5. به Supabase ارسال می‌شود: `{ date, start_date, end_date }`
6. State مشترک آپدیت می‌شود
7. همه تب‌ها (Tasks, Board, Timeline) به‌روز می‌شوند

---

## تست

برای تست کامل:

1. ✅ یک پروژه بسازید
2. ✅ چند task با تاریخ‌های مختلف اضافه کنید
3. ✅ تب Tasks: باید همه taskها نمایش داده شوند
4. ✅ تب Board: taskها را بین ستون‌ها drag کنید
5. ✅ تب Timeline: 
   - taskها را روی تقویم ببینید
   - یک task را به روز دیگر بکشید
   - روی task کلیک کنید و تاریخ شروع/پایان را تغییر دهید
   - روی یک روز کلیک کنید و task جدید بسازید
6. ✅ بین تب‌ها جابجا شوید - تغییرات باید در همه جا نمایش داده شوند

---

## نکات مهم

- ✅ همه labels فارسی هستند
- ✅ Layout کاملاً RTL است
- ✅ از تاریخ جلالی برای نمایش استفاده می‌شود
- ✅ TypeScript errors وجود ندارد
- ✅ State مشترک بین همه تب‌ها
- ✅ Drag & drop با حفظ duration
- ✅ فیلدهای date فقط در صورت نیاز ارسال می‌شوند (DB defaults)
