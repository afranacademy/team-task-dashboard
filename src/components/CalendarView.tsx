import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import { Task, TaskStatus, Project, TeamMember } from "@/types";
import { toJalali } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

const WEEKDAY_FULL = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

const WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  completed: "#6b7280",
  on_hold: "#facc15",
  planning: "#3b82f6",
};

const DEFAULT_PROJECT_COLOR = "#6366f1";

type CalendarProject = Project & {
  status?: string | null;
};

type CalendarTask = Task & {
  project_id?: string | null;
  projectName?: string;
  projectColor?: string;
  start_time?: string | null;
  end_time?: string | null;
};

type CalendarDay = {
  date: string;
  jalaliDate: { year: number; month: number; day: number };
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTask[];
};

type ViewMode = "day" | "week" | "month";

type CalendarViewProps = {
  currentUser: TeamMember;
};

type SupabaseTaskRow = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  priority?: "low" | "medium" | "high" | null;
  status?: TaskStatus | null;
  project_id?: string | null;
  expected_outcome?: string | null;
  progress?: number | null;
  comments?: string[] | null;
  is_private?: boolean | null;
};

type SupabaseProjectRow = {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  created_at?: string | null;
  status?: string | null;
};

const normalizeDate = (date: Date) => date.toISOString().split("T")[0];

const parseIsoDateToLocal = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const saturdayFirstIndex = (day: number) => (day === 6 ? 0 : day + 1);

const getProjectColor = (status?: string | null) => {
  if (!status) return DEFAULT_PROJECT_COLOR;
  return PROJECT_STATUS_COLORS[status.toLowerCase()] ?? DEFAULT_PROJECT_COLOR;
};

export function CalendarView({ currentUser }: CalendarViewProps) {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [projects, setProjects] = useState<CalendarProject[]>([]);
  const [visibleProjects, setVisibleProjects] = useState<Set<string>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const initializedFiltersRef = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: normalizeDate(new Date()),
    start_time: "",
    end_time: "",
    is_all_day: false,
    priority: "medium" as Task["priority"],
    project_id: null as string | null,
  });

  const jalaliSelected = useMemo(() => toJalali(selectedDate), [selectedDate]);

  const loadCalendarData = useCallback(async () => {
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

      const { data: rawTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("member_id", currentUser.id)
        .gte("date", normalizeDate(bufferStart))
        .lte("date", normalizeDate(bufferEnd));

      if (tasksError) throw tasksError;

      const taskRows = (rawTasks ?? []) as SupabaseTaskRow[];
      const projectIds = Array.from(
        new Set(
          taskRows
            .map(row => row.project_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      let projectRows: SupabaseProjectRow[] = [];
      if (projectIds.length > 0) {
        const { data: rawProjects, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds);

        if (projectsError) throw projectsError;
        projectRows = (rawProjects ?? []) as SupabaseProjectRow[];
      }

      const projectMap = new Map<string, CalendarProject>();
      const mappedProjects = projectRows.map(row => {
        const project: CalendarProject = {
          id: String(row.id),
          name: row.name,
          description: row.description ?? undefined,
          ownerId: row.owner_id ? String(row.owner_id) : undefined,
          createdAt: row.created_at ?? undefined,
          status: row.status ?? undefined,
        };
        projectMap.set(project.id, project);
        return project;
      });

      const enrichedTasks: CalendarTask[] = taskRows.map(row => {
        const projectId = row.project_id ?? undefined;
        const project = projectId ? projectMap.get(projectId) : undefined;

        return {
          id: String(row.id),
          title: row.title,
          description: row.description ?? "",
          status: (row.status as TaskStatus) ?? "To Do",
          progress: typeof row.progress === "number" ? row.progress : 0,
          expectedOutcome: row.expected_outcome ?? "",
          deadline: row.deadline ?? undefined,
          date: row.date,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null,
          start_time: row.start_time ?? null,
          end_time: row.end_time ?? null,
          comments: row.comments ?? [],
          isPrivate: row.is_private ?? !projectId,
          projectId,
          project_id: projectId ?? null,
          priority: (row.priority ?? "medium") as Task["priority"],
          projectName: project?.name,
          projectColor: getProjectColor(project?.status),
        };
      });

      setTasks(enrichedTasks);
      setProjects(mappedProjects);

      if (!initializedFiltersRef.current && projectIds.length > 0) {
        setVisibleProjects(new Set(projectIds));
        initializedFiltersRef.current = true;
      }
    } catch (error) {
      console.error("Error loading calendar data", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, selectedDate]);

  useEffect(() => {
    void loadCalendarData();
  }, [loadCalendarData]);

  const calendarDays = useMemo(() => {
    const searchTerm = searchQuery.trim().toLowerCase();
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const baseDay = new Date(startOfMonth);
    const offset = saturdayFirstIndex(startOfMonth.getDay());
    baseDay.setDate(baseDay.getDate() - offset);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(baseDay);
      day.setDate(baseDay.getDate() + index);
      const dateString = normalizeDate(day);
      const dayTasks = tasks.filter(task => {
        if (task.project_id && !visibleProjects.has(task.project_id)) {
          return false;
        }

        if (
          searchTerm &&
          !task.title.toLowerCase().includes(searchTerm)
        ) {
          return false;
        }

        if (task.date === dateString) return true;
        if (task.start_date && task.end_date) {
          return dateString >= task.start_date && dateString <= task.end_date;
        }

        return false;
      });

      const normalizedDay = new Date(day);
      normalizedDay.setHours(0, 0, 0, 0);

      return {
        date: dateString,
        jalaliDate: toJalali(day),
        isCurrentMonth: day.getMonth() === selectedDate.getMonth(),
        isToday: normalizedDay.getTime() === today.getTime(),
        tasks: dayTasks,
      };
    });
  }, [selectedDate, tasks, searchQuery, visibleProjects]);

  const handlePrevMonth = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);
      next.setDate(1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      next.setDate(1);
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const openNewEventModal = (date?: string) => {
    setSelectedTask(null);
    setFormData(prev => ({
      ...prev,
      title: "",
      description: "",
      date: date ?? normalizeDate(new Date()),
      start_time: "",
      end_time: "",
      is_all_day: false,
      priority: "medium",
      project_id: null,
    }));
    setShowEventModal(true);
  };

  const openEditEventModal = (task: CalendarTask) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      date: task.date,
      start_time: task.start_time ?? "",
      end_time: task.end_time ?? "",
      is_all_day: !task.start_time && !task.end_time,
      priority: task.priority ?? "medium",
      project_id: task.project_id ?? null,
    });
    setShowEventModal(true);
  };

  const handleEventModalChange = (open: boolean) => {
    setShowEventModal(open);
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      date: formData.date,
      start_time: formData.is_all_day ? null : formData.start_time || null,
      end_time: formData.is_all_day ? null : formData.end_time || null,
      priority: formData.priority,
      project_id: formData.project_id,
      member_id: currentUser.id,
      status: (selectedTask?.status as TaskStatus) ?? "To Do",
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
      await loadCalendarData();
    } catch (error) {
      console.error("Error saving task", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedTask) return;
    if (!window.confirm("آیا مطمئن هستید که می‌خواهید این رویداد حذف شود؟")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", selectedTask.id);
      if (error) throw error;

      setShowEventModal(false);
      await loadCalendarData();
    } catch (error) {
      console.error("Error deleting task", error);
    }
  };

  const handleDayCellClick = (date: string) => {
    setSelectedDate(parseIsoDateToLocal(date));
    openNewEventModal(date);
  };

  const handleProjectRowClick = (
    event: MouseEvent<HTMLDivElement>,
    projectId: string
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-slot='checkbox']")) {
      return;
    }

    toggleProjectVisibility(projectId);
  };

  const toggleProjectVisibility = (projectId: string) => {
    setVisibleProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const formSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSaveEvent();
  };

  return (
    <div
      dir="rtl"
      className="flex min-h-screen w-full flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-6"
    >
      <div className="mx-auto flex w-full max-w-[1280px] gap-4">
        <aside className="flex w-80 flex-col gap-6 rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">
                {JALALI_MONTH_NAMES[jalaliSelected.month - 1]} {jalaliSelected.year}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  aria-label="ماه قبل"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  aria-label="ماه بعد"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {WEEKDAY_SHORT.map((letter, index) => (
                <span key={index}>{letter}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {calendarDays.map(day => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(parseIsoDateToLocal(day.date))}
                  className={[
                    "flex h-10 items-center justify-center rounded-lg transition",
                    day.isToday ? "bg-primary text-primary-foreground" : "",
                    !day.isCurrentMonth ? "text-muted-foreground opacity-60" : "",
                    day.tasks.length > 0 ? "font-semibold" : "font-normal",
                  ].join(" ")}
                >
                  {day.jalaliDate.day}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-right text-sm font-semibold">جستجوی رویدادها</Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Search className="size-4 text-muted-foreground" />
              </div>
              <Input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="عنوان، پروژه یا کلمه کلیدی"
                className="pr-10 text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>تقویم‌های من</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span>وظایف شخصی</span>
              </div>
              {projects.map(project => (
                <div
                  key={project.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-accent/30"
                  onClick={event => handleProjectRowClick(event, project.id)}
                  role="button"
                  tabIndex={0}
                >
                  <Checkbox
                    checked={visibleProjects.has(project.id)}
                    onCheckedChange={() => toggleProjectVisibility(project.id)}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getProjectColor(project.status) }}
                  />
                  <span className="text-sm font-medium">{project.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="default"
            className="mt-auto flex w-full items-center justify-center gap-2"
            onClick={() => openNewEventModal(normalizeDate(new Date()))}
          >
            <Plus className="size-4" />
            رویداد جدید
          </Button>
        </aside>

        <section className="flex-1 space-y-4">
          <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-base font-semibold">
                <span>
                  {JALALI_MONTH_NAMES[jalaliSelected.month - 1]} {jalaliSelected.year}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="text-sm"
                >
                  امروز
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  aria-label="ماه قبل"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  aria-label="ماه بعد"
                >
                  <ChevronRight />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={viewMode === "day" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("day")}
                  >
                    روز
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "week" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                  >
                    هفته
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "month" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                  >
                    ماه
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {viewMode === "month" ? (
            <div className="relative rounded-2xl border border-border bg-background/80 p-4 shadow-sm">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/80 text-sm font-medium text-muted-foreground">
                  در حال بارگذاری...
                </div>
              )}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {WEEKDAY_FULL.map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="mt-3 grid flex-1 grid-cols-7 gap-3">
                {calendarDays.map(day => {
                  const dayTasks = day.tasks.slice(0, 3);
                  const remainingCount =
                    day.tasks.length > 3 ? day.tasks.length - 3 : 0;
                  return (
                    <div
                      key={day.date}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleDayCellClick(day.date)}
                      className={[
                        "flex h-40 flex-col rounded-2xl border border-border bg-background/60 p-3 transition hover:shadow-lg",
                        day.isToday ? "ring-2 ring-primary/70" : "",
                        !day.isCurrentMonth ? "opacity-60" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{day.jalaliDate.day}</span>
                        {day.isToday && (
                          <span className="text-[11px] text-primary">امروز</span>
                        )}
                      </div>
                      <div className="mt-3 flex flex-1 flex-col gap-1">
                        {dayTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={event => {
                              event.stopPropagation();
                              openEditEventModal(task);
                            }}
                            className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90"
                            style={{
                              backgroundColor:
                                task.projectColor ?? DEFAULT_PROJECT_COLOR,
                            }}
                          >
                            <span className="flex items-center gap-2">
                              {task.start_time
                                ? task.start_time.slice(0, 5)
                                : null}
                              {task.title}
                            </span>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{remainingCount} مورد دیگر
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : viewMode === "week" ? (
            <div className="rounded-2xl border border-border bg-background/80 p-10 text-center text-sm font-medium text-muted-foreground">
              نمای هفتگی به زودی...
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background/80 p-10 text-center text-sm font-medium text-muted-foreground">
              نمای روزانه به زودی...
            </div>
          )}
        </section>
      </div>

      <Dialog open={showEventModal} onOpenChange={handleEventModalChange}>
        <DialogContent className="max-w-xl rounded-2xl border border-border bg-background/80 p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-right">
              {selectedTask ? "ویرایش رویداد" : "رویداد جدید"}
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={formSubmit}>
            <div className="space-y-1">
              <Label htmlFor="event-title" className="text-right">
                عنوان رویداد
              </Label>
              <Input
                id="event-title"
                value={formData.title}
                onChange={event =>
                  setFormData(prev => ({ ...prev, title: event.target.value }))
                }
                required
                className="text-right"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="event-date" className="text-right">
                تاریخ
              </Label>
              <Input
                id="event-date"
                type="date"
                value={formData.date}
                onChange={event =>
                  setFormData(prev => ({ ...prev, date: event.target.value }))
                }
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="all-day"
                checked={formData.is_all_day}
                onCheckedChange={checked =>
                  setFormData(prev => ({
                    ...prev,
                    is_all_day: Boolean(checked),
                    start_time: Boolean(checked) ? "" : prev.start_time,
                    end_time: Boolean(checked) ? "" : prev.end_time,
                  }))
                }
              />
              <Label htmlFor="all-day" className="text-right text-sm font-semibold">
                تمام روز
              </Label>
            </div>

            {!formData.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="start-time" className="text-right">
                    زمان شروع
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formData.start_time}
                    onChange={event =>
                      setFormData(prev => ({
                        ...prev,
                        start_time: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="end-time" className="text-right">
                    زمان پایان
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formData.end_time}
                    onChange={event =>
                      setFormData(prev => ({ ...prev, end_time: event.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="priority" className="text-right">
                  اولویت
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      priority: value as Task["priority"],
                    }))
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">کم</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">زیاد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="project" className="text-right">
                  پروژه
                </Label>
                <Select
                  value={formData.project_id ?? "personal"}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      project_id: value === "personal" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger id="project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">شخصی</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="text-right">
                توضیحات
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={event =>
                  setFormData(prev => ({ ...prev, description: event.target.value }))
                }
                className="text-right"
                rows={3}
              />
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEventModalChange(false)}
              >
                لغو
              </Button>
              {selectedTask && (
                <Button type="button" variant="destructive" onClick={handleDeleteEvent}>
                  حذف
                </Button>
              )}
              <Button type="submit">ذخیره</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
