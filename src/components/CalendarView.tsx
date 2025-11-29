// src/components/CalendarView.tsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { Task, Project, TeamMember } from "../types";
import { toJalali } from "../utils/jalaliUtils";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

type CalendarTask = Task & {
  // این‌ها برای این است که اگر در type اصلی نبودند، خطای TS نگیری
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: "low" | "medium" | "high";
  project_id?: string | null;
  projectName?: string;
  projectColor?: string;
};

type CalendarDay = {
  date: string; // YYYY-MM-DD
  jalaliDate: { year: number; month: number; day: number };
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
};

type ViewMode = "day" | "week" | "month";

type CalendarViewProps = {
  currentUser: TeamMember;
};

const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const JALALI_DAY_LETTERS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const JALALI_DAY_FULL = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

export function CalendarView({ currentUser }: CalendarViewProps) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [visibleProjects, setVisibleProjects] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    priority: "low" | "medium" | "high";
    project_id: string | null;
  }>({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    end_time: "",
    is_all_day: false,
    priority: "medium",
    project_id: null,
  });

  const jalaliSelected = useMemo(
    () => toJalali(selectedDate),
    [selectedDate]
  );

  // ---------- Fetch data from Supabase ----------

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, selectedDate]);

  async function fetchData() {
    setLoading(true);
    try {
      const startOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      );

      const bufferStart = new Date(startOfMonth);
      bufferStart.setDate(bufferStart.getDate() - 7);
      const bufferEnd = new Date(endOfMonth);
      bufferEnd.setDate(bufferEnd.getDate() + 7);

      const from = bufferStart.toISOString().split("T")[0];
      const to = bufferEnd.toISOString().split("T")[0];

      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("member_id", currentUser.id)
        .gte("date", from)
        .lte("date", to);

      if (tasksError) throw tasksError;

      const projectIds = Array.from(
        new Set(
          (tasksData || [])
            .map((t: any) => t.project_id)
            .filter((id: any): id is string => Boolean(id))
        )
      );

      let projectsData: Project[] = [];
      if (projectIds.length > 0) {
        const { data, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds);

        if (projectsError) throw projectsError;
        projectsData = data || [];
      }

      const enriched: CalendarTask[] = (tasksData || []).map((task: any) => {
        const project = projectsData.find((p) => p.id === task.project_id);
        return {
          ...task,
          projectName: project?.name,
          projectColor: getProjectColor(project),
        };
      });

      setTasks(enriched);
      setProjects(projectsData);

      if (visibleProjects.size === 0 && projectIds.length > 0) {
        setVisibleProjects(new Set<string>(projectIds));
      }
    } catch (err) {
      console.error("Error loading calendar data", err);
    } finally {
      setLoading(false);
    }
  }

  function getProjectColor(project?: Project) {
    if (!project) return "#6366f1";
    const status = (project as any).status || "active";
    const colors: Record<string, string> = {
      active: "#10b981",
      planning: "#3b82f6",
      completed: "#6b7280",
      on_hold: "#f59e0b",
    };
      // @ts-ignore
    return colors[status] || "#6366f1";
  }

  // ---------- Calendar generation ----------

  const calendarDays: CalendarDay[] = useMemo(() => {
    const days: CalendarDay[] = [];

    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const last = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    // در JS: 0=Sunday, 6=Saturday
    let startDay = first.getDay(); // 0..6
    // می‌خوایم شنبه رو ستون اول کنیم
    startDay = startDay === 6 ? 0 : startDay + 1;

    const prevStart = new Date(first);
    prevStart.setDate(prevStart.getDate() - startDay);

    // روزهای قبل از ماه
    for (let i = 0; i < startDay; i++) {
      const d = new Date(prevStart);
      d.setDate(d.getDate() + i);
      days.push(createCalendarDay(d, false));
    }

    // خود ماه
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      days.push(createCalendarDay(d, true));
    }

    // روزهای بعد برای پر شدن ۶×۷
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(last);
      d.setDate(d.getDate() + i);
      days.push(createCalendarDay(d, false));
    }

    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, tasks, searchQuery, visibleProjects]);

  function createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateStr = date.toISOString().split("T")[0];
    const jalali = toJalali(date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cmp = new Date(date);
    cmp.setHours(0, 0, 0, 0);

    const dayTasks = tasks.filter((task) => {
      if (task.project_id && !visibleProjects.has(task.project_id)) return false;
      if (
        searchQuery &&
        !task.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      if (task.date === dateStr) return true;

      if (task.start_date && task.end_date) {
        return dateStr >= task.start_date && dateStr <= task.end_date;
      }

      return false;
    });

    return {
      date: dateStr,
      jalaliDate: jalali,
      isCurrentMonth,
      isToday: cmp.getTime() === today.getTime(),
      tasks: dayTasks,
    };
  }

  // ---------- Navigation ----------

  function handlePrevMonth() {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  }

  function handleToday() {
    setSelectedDate(new Date());
  }

  // ---------- Modal helpers ----------

  function openNewEventModal(date?: string) {
    setSelectedTask(null);
    setFormData({
      title: "",
      description: "",
      date: date || new Date().toISOString().split("T")[0],
      start_time: "",
      end_time: "",
      is_all_day: false,
      priority: "medium",
      project_id: null,
    });
    setShowEventModal(true);
  }

  function openEditEventModal(task: CalendarTask) {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: (task.description as string) || "",
      date: task.date,
      start_time: task.start_time || "",
      end_time: task.end_time || "",
      is_all_day: !task.start_time && !task.end_time,
      priority: (task.priority as any) || "medium",
      project_id: task.project_id ?? null,
    });
    setShowEventModal(true);
  }

  async function handleSaveEvent() {
    if (!formData.title.trim()) return;

    const payload: any = {
      title: formData.title,
      description: formData.description || null,
      date: formData.date,
      start_time: formData.is_all_day ? null : formData.start_time || null,
      end_time: formData.is_all_day ? null : formData.end_time || null,
      priority: formData.priority,
      project_id: formData.project_id,
      member_id: currentUser.id,
      status: (selectedTask?.status as any) || "todo",
      is_private: !formData.project_id,
    };

    try {
      if (selectedTask) {
        const { error } = await supabase
          .from("tasks")
          .update(payload)
          .eq("id", selectedTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
      }

      setShowEventModal(false);
      fetchData();
    } catch (err) {
      console.error("Error saving task", err);
      alert("خطا در ذخیره رویداد");
    }
  }

  async function handleDeleteEvent() {
    if (!selectedTask) return;
    if (!confirm("این رویداد حذف شود؟")) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", selectedTask.id);
      if (error) throw error;
      setShowEventModal(false);
      fetchData();
    } catch (err) {
      console.error("Error deleting task", err);
      alert("خطا در حذف رویداد");
    }
  }

  function toggleProjectVisibility(projectId: string) {
    const next = new Set(visibleProjects);
    if (next.has(projectId)) next.delete(projectId);
    else next.add(projectId);
    setVisibleProjects(next);
  }

  // ---------- Mini calendar ----------

  function renderMiniCalendar() {
    const miniDays = calendarDays; // برای سادگی از همون آرایه استفاده می‌کنیم

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {JALALI_DAY_LETTERS.map((d) => (
            <div key={d} className="font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {miniDays.map((day, idx) => {
            const hasEvents = day.tasks.length > 0;

            return (
              <button
                key={idx}
                onClick={() => {
                  const [y, m, d] = day.date.split("-").map(Number);
                  setSelectedDate(new Date(y, m - 1, d));
                }}
                className={[
                  "aspect-square text-xs rounded-md transition-colors",
                  !day.isCurrentMonth ? "text-muted-foreground/40" : "",
                  day.isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "",
                  !day.isToday && day.isCurrentMonth ? "hover:bg-accent" : "",
                  hasEvents && !day.isToday ? "font-semibold" : "",
                ].join(" ")}
              >
                {day.jalaliDate.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" dir="rtl">
        <div className="text-lg text-muted-foreground">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 border-l border-border bg-card p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Mini calendar */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {JALALI_MONTH_NAMES[jalaliSelected.month - 1]}{" "}
                {jalaliSelected.year}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderMiniCalendar()}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی رویدادها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* Calendars */}
          <div>
            <h3 className="font-semibold mb-3">تقویم‌های من</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md">
                <Checkbox checked disabled />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#6366f1" }}
                />
                <span className="text-sm">وظایف شخصی</span>
              </label>
              {projects.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded-md"
                >
                  <Checkbox
                    checked={visibleProjects.has(p.id)}
                    onCheckedChange={(checked: boolean) => toggleProjectVisibility(p.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getProjectColor(p) }}
                  />
                  <span className="text-sm">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => openNewEventModal()}
          >
            <Plus className="h-4 w-4 ml-2" />
            رویداد جدید
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {JALALI_MONTH_NAMES[jalaliSelected.month - 1]}{" "}
                {jalaliSelected.year}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleToday}>
                  امروز
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handlePrevMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleNextMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                روز
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                هفته
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                ماه
              </Button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "month" && (
            <div className="h-full">
              {/* Weekday header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {JALALI_DAY_FULL.map((d) => (
                  <div
                    key={d}
                    className="text-center text-sm font-semibold text-muted-foreground p-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={[
                      "border border-border rounded-lg p-2 overflow-hidden cursor-pointer transition-shadow bg-card",
                      day.isToday ? "ring-2 ring-primary bg-primary/5" : "",
                      !day.isCurrentMonth ? "opacity-50" : "",
                      "hover:shadow-md",
                    ].join(" ")}
                    onClick={() => openNewEventModal(day.date)}
                  >
                    <div
                      className={[
                        "text-sm font-semibold mb-1",
                        day.isToday ? "text-primary" : "",
                      ].join(" ")}
                    >
                      {day.jalaliDate.day}
                    </div>

                    <div className="space-y-1">
                      {day.tasks.slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          className="w-full text-right text-xs p-1 rounded truncate hover:opacity-80"
                          style={{
                            backgroundColor: task.projectColor || "#6366f1",
                            color: "#fff",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditEventModal(task);
                          }}
                        >
                          {task.start_time && (
                            <span className="ml-1 opacity-90">
                              {task.start_time.substring(0, 5)}
                            </span>
                          )}
                          {task.title}
                        </button>
                      ))}

                      {day.tasks.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{day.tasks.length - 3} مورد دیگر
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(viewMode === "day" || viewMode === "week") && (
            <div className="text-center text-muted-foreground py-10">
              نمای {viewMode === "day" ? "روزانه" : "هفتگی"} به‌زودی اضافه
              می‌شود.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? "ویرایش رویداد" : "رویداد جدید"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان رویداد</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="عنوان را وارد کنید..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">تاریخ</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="all-day"
                checked={formData.is_all_day}
                onCheckedChange={(checked: boolean) =>
                  setFormData((f) => ({
                    ...f,
                    is_all_day: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="all-day" className="cursor-pointer">
                تمام روز
              </Label>
            </div>

            {!formData.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">زمان شروع</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        start_time: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">زمان پایان</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        end_time: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>اولویت</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setFormData((f) => ({ ...f, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب اولویت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">کم</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">زیاد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>پروژه</Label>
              <Select
                value={formData.project_id || "personal"}
                onValueChange={(value: string) =>
                  setFormData((f) => ({
                    ...f,
                    project_id: value === "personal" ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب پروژه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">شخصی</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="توضیحات اضافی..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              {selectedTask && (
                <Button
                  variant="destructive"
                  className="ml-auto"
                  onClick={handleDeleteEvent}
                >
                  حذف
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowEventModal(false)}
              >
                لغو
              </Button>
              <Button onClick={handleSaveEvent}>ذخیره</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}