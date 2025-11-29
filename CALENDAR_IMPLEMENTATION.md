# پیاده‌سازی Calendar View - خلاصه کامل

## فایل‌های ایجاد شده

### 1. `src/hooks/useUserTasksForRange.ts` ✅
**هدف**: Hook برای fetch کردن taskهای کاربر در یک بازه زمانی مشخص

**ویژگی‌ها**:
- دریافت tasks از Supabase با فیلتر `member_id` و بازه تاریخ
- Map کردن داده‌های database به Task type
- مدیریت loading و error states
- تابع `refetch` برای بارگذاری مجدد

---

### 2. `src/lib/calendarUtils.ts` ✅
**هدف**: توابع کمکی برای کار با تقویم

**توابع**:
- `getMonthDays()`: ساخت آرایه روزهای ماه (42 روز برای 6 هفته)
- `getMonthRange()`: محاسبه بازه تاریخی برای fetch کردن tasks
- `getPersianWeekDays()`: آرایه نام روزهای هفته به فارسی
- `addMonths()`: اضافه کردن ماه به تاریخ
- `isSameDay()`: مقایسه دو تاریخ
- `isToday()`: بررسی امروز بودن تاریخ

---

### 3. `src/components/CalendarView.tsx` ✅
**هدف**: کامپوننت اصلی Calendar که همه چیز را کنترل می‌کند

**ویژگی‌ها**:
- مدیریت state برای ماه جاری، تاریخ انتخاب شده، view mode
- استفاده از `useUserTasksForRange` برای fetch کردن tasks
- فیلتر کردن tasks بر اساس toggleهای sidebar (personal/project)
- Layout دو ستونه: sidebar + main panel
- مدیریت dialog برای ایجاد task جدید

---

### 4. `src/components/CalendarSidebar.tsx` ✅
**هدف**: Sidebar سمت راست با mini calendar و فیلترها

**بخش‌ها**:
- **Search box**: جستجو (placeholder فعلاً)
- **Mini calendar**: تقویم کوچک برای navigation سریع
  - نمایش روزهای ماه
  - هایلایت امروز و روز انتخاب شده
  - کلیک برای انتخاب روز
- **My calendars**: دو toggle برای فیلتر کردن
  - وظایف من (personal tasks)
  - وظایف پروژه‌ها (project tasks)

---

### 5. `src/components/CalendarHeader.tsx` ✅
**هدف**: Header بالای calendar با navigation و view modes

**المان‌ها**:
- نام ماه و سال به جلالی
- دکمه "امروز" برای بازگشت به ماه جاری
- دکمه‌های prev/next برای navigation بین ماه‌ها
- دکمه‌های view mode: روز / هفته / ماه (فعلاً فقط ماه کامل است)

---

### 6. `src/components/CalendarMonthGrid.tsx` ✅
**هدف**: Grid اصلی تقویم ماهانه (مهم‌ترین بخش)

**ویژگی‌ها**:
- Grid 7×6 برای نمایش روزهای ماه
- Header row با نام روزهای هفته (شنبه تا جمعه)
- هر سلول:
  - شماره روز
  - Badge با تعداد tasks
  - لیست taskها (حداکثر 3 تا)
  - "+ X مورد دیگر" برای taskهای بیشتر
- رنگ‌بندی:
  - آبی: personal tasks
  - بنفش: project tasks
- هایلایت:
  - امروز: پس‌زمینه بنفش
  - آخر هفته: پس‌زمینه آبی ملایم
  - روزهای ماه قبل/بعد: opacity کمتر
- کلیک روی روز: باز کردن dialog برای ایجاد task
- کلیک روی task: نمایش جزئیات task

---

### 7. `src/components/NewCalendarTaskDialog.tsx` ✅
**هدف**: Dialog برای ایجاد task جدید از calendar

**فیلدها**:
- عنوان وظیفه (required)
- تاریخ (با نمایش جلالی)
- انتخاب پروژه (dropdown - اختیاری)
- وضعیت (To Do / In Progress / Completed)
- اولویت (بالا / متوسط / پایین)
- توضیحات (textarea)
- سوییچ "وظیفه خصوصی است"

**رفتار**:
- تاریخ پیش‌فرض: روزی که کاربر کلیک کرده
- Insert مستقیم به Supabase
- بعد از ایجاد: refetch tasks و بستن dialog

---

## فایل‌های تغییر یافته

### 8. `src/components/PersonalDashboard.tsx` ✅
**تغییرات**:
- اضافه شدن import برای `CalendarView` و `Tabs`
- اضافه شدن state برای `activeTab`
- تبدیل layout به Tabs با دو tab:
  - **داشبورد**: همان dashboard قبلی
  - **تقویم**: CalendarView جدید
- TabsList در کنار DashboardHeader برای سوییچ بین tabها

---

## جریان کار (Flow)

### 1. ورود به Calendar
```
PersonalDashboard → کلیک روی tab "تقویم" → CalendarView render می‌شود
```

### 2. نمایش Tasks
```
CalendarView
  ↓
useUserTasksForRange(userId, from, to)
  ↓
Fetch از Supabase: tasks WHERE member_id = userId AND date BETWEEN from AND to
  ↓
CalendarMonthGrid: group tasks by date
  ↓
نمایش در سلول‌های مربوطه
```

### 3. ایجاد Task جدید
```
کلیک روی روز در CalendarMonthGrid
  ↓
CalendarView: setSelectedDate + setDialogOpen(true)
  ↓
NewCalendarTaskDialog باز می‌شود با defaultDate
  ↓
کاربر فرم را پر می‌کند
  ↓
Submit → Insert به Supabase
  ↓
onTaskCreated → refetch tasks
  ↓
Calendar به‌روز می‌شود
```

### 4. فیلتر کردن Tasks
```
CalendarSidebar: toggle "وظایف من" یا "وظایف پروژه‌ها"
  ↓
CalendarView: filteredTasks محاسبه می‌شود
  ↓
CalendarMonthGrid: فقط filtered tasks نمایش داده می‌شوند
```

---

## ویژگی‌های کلیدی

### ✅ Auto-population
- همه taskهای کاربر (personal + project) که `member_id === currentUser.id` هستند، خودکار در calendar نمایش داده می‌شوند
- هر task که از جاهای دیگر app ایجاد شود (project detail, board, etc.) در calendar هم ظاهر می‌شود

### ✅ Personal vs Project
- **Personal task**: `project_id === null` یا `is_private === true`
  - رنگ: آبی
- **Project task**: `project_id !== null` و `is_private === false`
  - رنگ: بنفش

### ✅ RTL و فارسی
- تمام layout RTL است (`dir="rtl"`)
- همه labels فارسی هستند
- تاریخ‌ها با `formatJalaliDate` نمایش داده می‌شوند
- روزهای هفته: ش، ی، د، س، چ، پ، ج

### ✅ Responsive و Modern
- Grid responsive با Tailwind
- Hover effects و transitions
- shadcn/ui components
- رنگ‌بندی consistent با بقیه app

---

## تست

برای تست کامل:

1. ✅ وارد PersonalDashboard شوید
2. ✅ روی tab "تقویم" کلیک کنید
3. ✅ باید همه taskهای ماه جاری نمایش داده شوند
4. ✅ روی یک روز کلیک کنید → dialog باز می‌شود
5. ✅ یک task جدید بسازید → باید در calendar ظاهر شود
6. ✅ toggleهای sidebar را تست کنید (فیلتر personal/project)
7. ✅ mini calendar را تست کنید (کلیک روی روزها)
8. ✅ navigation بین ماه‌ها را تست کنید (prev/next/today)
9. ✅ روی یک task کلیک کنید → باید TaskDetailModal باز شود

---

## نکات مهم

- ✅ هیچ تغییری در Supabase schema نشده
- ✅ از همان Task type موجود استفاده شده
- ✅ PersonalDashboard قبلی دست نخورده (فقط Tabs اضافه شده)
- ✅ TypeScript errors وجود ندارد
- ✅ همه imports درست هستند
- ✅ Calendar یک tab جداگانه است و با بقیه app conflict ندارد

---

## TODO (اختیاری برای آینده)

- [ ] پیاده‌سازی Week view
- [ ] پیاده‌سازی Day view
- [ ] پیاده‌سازی Search در sidebar
- [ ] Drag & drop برای تغییر تاریخ tasks
- [ ] نمایش رنگ‌های مختلف برای هر پروژه
- [ ] Export calendar به PDF/iCal
