import { TeamMember } from '../types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'سارا احمدی',
    role: 'طراح محصول',
    initials: 'SA',
    password: '1234',
    accessPermissions: ['2', '4'], // Marcus and Alex can view
    tasks: [
      {
        id: 't1',
        title: 'طراحی فلو ثبت‌نام کاربران',
        description: 'ساخت وایرفریم و موکاپ برای تجربه ثبت‌نام کاربران',
        status: 'In Progress',
        progress: 65,
        expectedOutcome: 'بهبود نرخ فعال‌سازی کاربران تا 30٪',
        startDate: '2025-11-20',
        date: today,
        deadline: '2025-11-27',
      },
      {
        id: 't2',
        title: 'بروزرسانی رنگ‌های Design System',
        description: 'اصلاح پالت رنگی برای رعایت استانداردهای دسترسی',
        status: 'Completed',
        progress: 100,
        expectedOutcome: 'تمام کامپوننت‌ها استاندارد دسترسی را رعایت می‌کنند',
        startDate: '2025-11-18',
        date: yesterday,
        deadline: '2025-11-22',
      },
      {
        id: 't3',
        title: 'طراحی مجدد داشبورد موبایل',
        description: 'بهینه‌سازی لی‌آوت برای دستگاه‌های موبایل',
        status: 'To Do',
        progress: 0,
        expectedOutcome: 'افزایش تعامل کاربران موبایل',
        startDate: today,
        date: tomorrow,
        deadline: '2025-12-02',
      }
    ]
  },
  {
    id: '2',
    name: 'محمد رضایی',
    role: 'توسعه‌دهنده فرانت‌اند',
    initials: 'MR',
    password: '1234',
    accessPermissions: ['1', '3'], // Sara and Elena can view
    tasks: [
      {
        id: 't4',
        title: 'پیاده‌سازی سیستم احراز هویت',
        description: 'ساخت فلوهای ورود و ثبت‌نام با توکن JWT',
        status: 'In Progress',
        progress: 80,
        expectedOutcome: 'احراز هویت امن با مدیریت نشست',
        startDate: '2025-11-19',
        date: today,
        deadline: '2025-11-26',
      },
      {
        id: 't5',
        title: 'یکپارچه‌سازی API داشبورد',
        description: 'اتصال داشبورد به APIهای بک‌اند',
        status: 'Completed',
        progress: 100,
        expectedOutcome: 'نمایش داده به صورت Real-time',
        startDate: '2025-11-15',
        date: yesterday,
        deadline: '2025-11-20',
      },
      {
        id: 't6',
        title: 'بهینه‌سازی حجم Bundle',
        description: 'پیاده‌سازی Code Splitting و Lazy Loading',
        status: 'To Do',
        progress: 0,
        expectedOutcome: 'کاهش 40٪ زمان بارگذاری',
        startDate: today,
        date: tomorrow,
        deadline: '2025-11-29',
      }
    ]
  },
  {
    id: '3',
    name: 'الناز کریمی',
    role: 'توسعه‌دهنده بک‌اند',
    initials: 'EK',
    password: '1234',
    accessPermissions: ['2'], // Only Marcus can view
    tasks: [
      {
        id: 't8',
        title: 'بهینه‌سازی Schema پایگاه داده',
        description: 'بازنویسی کوئری‌ها و اضافه کردن Index',
        status: 'Completed',
        progress: 100,
        expectedOutcome: 'بهبود 60٪ عملکرد کوئری‌ها',
        startDate: '2025-11-18',
        date: yesterday,
        deadline: '2025-11-24',
      },
      {
        id: 't9',
        title: 'ساخت سرویس اعلان‌ها',
        description: 'ایجاد میکروسرویس برای Push Notification',
        status: 'In Progress',
        progress: 45,
        expectedOutcome: 'اعلان‌های Real-time برای کاربران',
        startDate: '2025-11-21',
        date: today,
        deadline: '2025-11-28',
      }
    ]
  },
  {
    id: '4',
    name: 'علی محمدی',
    role: 'مدیر محصول',
    initials: 'AM',
    password: '1234',
    accessPermissions: ['1', '2', '3', '5'], // Everyone can view
    tasks: [
      {
        id: 't10',
        title: 'برنامه‌ریزی Roadmap فصل چهارم',
        description: 'تعیین اولویت‌ها و ویژگی‌های سه‌ماهه بعد',
        status: 'In Progress',
        progress: 70,
        expectedOutcome: 'Roadmap شفاف همسو با اهداف کسب‌وکار',
        startDate: '2025-11-20',
        date: today,
        deadline: '2025-11-26',
      },
      {
        id: 't11',
        title: 'مصاحبه‌های تحقیق کاربری',
        description: 'انجام 10 مصاحبه برای جمع‌آوری بازخورد',
        status: 'Completed',
        progress: 100,
        expectedOutcome: 'بینش‌های ارزشمند برای بهبود محصول',
        startDate: '2025-11-10',
        date: yesterday,
        deadline: '2025-11-22',
      }
    ]
  },
  {
    id: '5',
    name: 'زهرا نوری',
    role: 'مهندس QA',
    initials: 'ZN',
    password: '1234',
    accessPermissions: [], // Private - no one can view
    tasks: [
      {
        id: 't13',
        title: 'راه‌اندازی Test Suite خودکار',
        description: 'پیکربندی تست E2E با Playwright',
        status: 'In Progress',
        progress: 55,
        expectedOutcome: 'کاهش 70٪ زمان تست دستی',
        startDate: '2025-11-19',
        date: today,
        deadline: '2025-11-27',
      }
    ]
  }
];
