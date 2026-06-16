import { create } from 'zustand';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import {
  SleepRecord, SleepPlan, Course, DormReminder,
  WeeklyStats, ScheduleMode, ConstraintConfig, ReminderConfig, SleepFactor, DailyStat
} from '@/types';
import { generateSleepPlan as genPlan } from '@/utils/sleepAlgorithm';

const STORAGE_KEYS = {
  courses: 'sleep_courses',
  constraints: 'sleep_constraints',
  scheduleMode: 'sleep_schedule_mode',
  sleepPlan: 'sleep_plan',
  todayRecord: 'sleep_today_record',
  historyRecords: 'sleep_history_records',
  reminder: 'sleep_reminder',
  dormReminders: 'sleep_dorm_reminders',
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) return JSON.parse(raw);
  } catch (_e) { /* ignore */ }
  return fallback;
};

const saveToStorage = (key: string, value: any) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(value));
  } catch (_e) { /* ignore */ }
};

const DEFAULT_CONSTRAINTS: ConstraintConfig[] = [
  { id: '1', type: 'curfew', name: '宿舍熄灯', icon: '🌙', time: '23:00', color: '#5B6DF0', bgColor: 'rgba(91, 109, 240, 0.2)', enabled: false },
  { id: '2', type: 'duty', name: '今晚值日', icon: '🧹', time: '22:00-22:30', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)', enabled: false },
  { id: '3', type: 'lateReturn', name: '晚自习晚归', icon: '📖', time: '22:30', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.2)', enabled: false },
];

interface SleepState {
  currentDate: string;
  todayRecord: SleepRecord | null;
  sleepPlan: SleepPlan | null;
  scheduleMode: ScheduleMode;
  courses: Course[];
  constraints: ConstraintConfig[];
  reminder: ReminderConfig;
  dormReminders: DormReminder[];
  historyRecords: SleepRecord[];
  consecutiveLateNights: number;

  setScheduleMode: (mode: ScheduleMode) => void;
  setTodayRecord: (record: SleepRecord) => void;
  updateTodayFactors: (factors: SleepFactor[]) => void;
  addDormReminder: (reminder: DormReminder) => void;
  updateCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  toggleConstraint: (id: string) => void;
  setConstraints: (constraints: ConstraintConfig[]) => void;
  generateSleepPlan: () => void;
  checkInSleep: (bedTime: string, wakeTime: string) => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderMinutesBefore: (minutes: number) => void;
  updateConsecutiveLateNights: () => void;
  getWeeklyStats: () => WeeklyStats;
}

export const useSleepStore = create<SleepState>((set, get) => ({
  currentDate: dayjs().format('YYYY-MM-DD'),
  todayRecord: loadFromStorage<SleepRecord | null>(STORAGE_KEYS.todayRecord, null),
  sleepPlan: loadFromStorage<SleepPlan | null>(STORAGE_KEYS.sleepPlan, null),
  scheduleMode: loadFromStorage<ScheduleMode>(STORAGE_KEYS.scheduleMode, 'normal'),
  courses: loadFromStorage<Course[]>(STORAGE_KEYS.courses, []),
  constraints: loadFromStorage<ConstraintConfig[]>(STORAGE_KEYS.constraints, DEFAULT_CONSTRAINTS),
  reminder: loadFromStorage<ReminderConfig>(STORAGE_KEYS.reminder, {
    enabled: false,
    minutesBefore: 30,
    reminderTime: '',
    lastTriggeredDate: '',
  }),
  dormReminders: loadFromStorage<DormReminder[]>(STORAGE_KEYS.dormReminders, []),
  historyRecords: loadFromStorage<SleepRecord[]>(STORAGE_KEYS.historyRecords, []),
  consecutiveLateNights: 0,

  setScheduleMode: (mode) => {
    set({ scheduleMode: mode });
    saveToStorage(STORAGE_KEYS.scheduleMode, mode);
    get().generateSleepPlan();
  },

  setTodayRecord: (record) => {
    set({ todayRecord: record });
    saveToStorage(STORAGE_KEYS.todayRecord, record);
  },

  updateTodayFactors: (factors) => {
    const { todayRecord, currentDate } = get();
    const record = todayRecord || {
      id: generateId(),
      date: currentDate,
      bedTime: '',
      wakeTime: '',
      sleepDuration: 0,
      quality: 0,
      isCompleted: false,
    };
    const updated = { ...record, factors };
    set({ todayRecord: updated });
    saveToStorage(STORAGE_KEYS.todayRecord, updated);
  },

  addDormReminder: (reminder) => {
    set((state) => {
      const updated = [reminder, ...state.dormReminders];
      saveToStorage(STORAGE_KEYS.dormReminders, updated);
      return { dormReminders: updated };
    });
  },

  updateCourses: (courses) => {
    set({ courses });
    saveToStorage(STORAGE_KEYS.courses, courses);
    get().generateSleepPlan();
  },

  addCourse: (course) => {
    const courses = [...get().courses, course];
    set({ courses });
    saveToStorage(STORAGE_KEYS.courses, courses);
    get().generateSleepPlan();
  },

  updateCourse: (id, partial) => {
    const courses = get().courses.map(c => c.id === id ? { ...c, ...partial } : c);
    set({ courses });
    saveToStorage(STORAGE_KEYS.courses, courses);
    get().generateSleepPlan();
  },

  deleteCourse: (id) => {
    const courses = get().courses.filter(c => c.id !== id);
    set({ courses });
    saveToStorage(STORAGE_KEYS.courses, courses);
    get().generateSleepPlan();
  },

  toggleConstraint: (id) => {
    const constraints = get().constraints.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    set({ constraints });
    saveToStorage(STORAGE_KEYS.constraints, constraints);
    get().generateSleepPlan();
  },

  setConstraints: (constraints) => {
    set({ constraints });
    saveToStorage(STORAGE_KEYS.constraints, constraints);
  },

  generateSleepPlan: () => {
    const { scheduleMode, courses, constraints } = get();
    const enabledConstraints = constraints.filter(c => c.enabled);
    const plan = genPlan(courses, scheduleMode, enabledConstraints);

    const reminder = get().reminder;
    if (reminder.enabled && plan.targetBedTime) {
      const bedTime = dayjs(`2000-01-01 ${plan.targetBedTime}`);
      const reminderTime = bedTime.subtract(reminder.minutesBefore, 'minute').format('HH:mm');
      const updatedReminder = { ...reminder, reminderTime };
      set({ reminder: updatedReminder });
      saveToStorage(STORAGE_KEYS.reminder, updatedReminder);
    }

    set({ sleepPlan: plan });
    saveToStorage(STORAGE_KEYS.sleepPlan, plan);
  },

  checkInSleep: (bedTime, wakeTime) => {
    const { todayRecord, currentDate, historyRecords } = get();
    const bed = dayjs(`2000-01-01 ${bedTime}`);
    let wake = dayjs(`2000-01-01 ${wakeTime}`);
    if (wake.isBefore(bed) || wake.isSame(bed)) {
      wake = wake.add(1, 'day');
    }
    const duration = wake.diff(bed, 'hour', true);

    const record: SleepRecord = {
      id: generateId(),
      date: currentDate,
      bedTime,
      wakeTime,
      sleepDuration: Math.round(duration * 10) / 10,
      quality: todayRecord?.quality || 75,
      factors: todayRecord?.factors || [],
      isCompleted: true,
    };

    const existingIdx = historyRecords.findIndex(r => r.date === currentDate);
    let newHistory: SleepRecord[];
    if (existingIdx >= 0) {
      newHistory = [...historyRecords];
      newHistory[existingIdx] = record;
    } else {
      newHistory = [...historyRecords, record];
    }
    if (newHistory.length > 30) {
      newHistory = newHistory.slice(-30);
    }

    set({
      todayRecord: record,
      historyRecords: newHistory,
    });
    saveToStorage(STORAGE_KEYS.todayRecord, record);
    saveToStorage(STORAGE_KEYS.historyRecords, newHistory);

    get().updateConsecutiveLateNights();
  },

  setReminderEnabled: (enabled) => {
    const reminder = { ...get().reminder, enabled };
    const plan = get().sleepPlan;
    if (enabled && plan?.targetBedTime) {
      const bedTime = dayjs(`2000-01-01 ${plan.targetBedTime}`);
      reminder.reminderTime = bedTime.subtract(reminder.minutesBefore, 'minute').format('HH:mm');
    }
    set({ reminder });
    saveToStorage(STORAGE_KEYS.reminder, reminder);
  },

  setReminderMinutesBefore: (minutes) => {
    const reminder = { ...get().reminder, minutesBefore: minutes };
    const plan = get().sleepPlan;
    if (plan?.targetBedTime) {
      const bedTime = dayjs(`2000-01-01 ${plan.targetBedTime}`);
      reminder.reminderTime = bedTime.subtract(minutes, 'minute').format('HH:mm');
    }
    set({ reminder });
    saveToStorage(STORAGE_KEYS.reminder, reminder);
  },

  updateConsecutiveLateNights: () => {
    const { historyRecords, sleepPlan } = get();
    const lateThreshold = sleepPlan?.targetBedTime || '23:00';
    const thresholdHour = parseInt(lateThreshold.split(':')[0]);
    const thresholdMinute = parseInt(lateThreshold.split(':')[1] || '0');
    const thresholdTotalMin = thresholdHour * 60 + thresholdMinute;

    let count = 0;
    const sorted = [...historyRecords].sort((a, b) => b.date.localeCompare(a.date));
    for (const record of sorted) {
      if (!record.isCompleted) break;
      const [bh, bm] = record.bedTime.split(':').map(Number);
      const bedTotalMin = bh * 60 + (bm || 0);
      const isLate = bedTotalMin > thresholdTotalMin + 30;
      if (isLate) {
        count++;
      } else {
        break;
      }
    }
    set({ consecutiveLateNights: count });
  },

  getWeeklyStats: () => {
    const { historyRecords, sleepPlan } = get();
    const today = dayjs();
    const weekStart = today.subtract(6, 'day');

    const weekRecords = historyRecords.filter(r => {
      const d = dayjs(r.date);
      return d.isAfter(weekStart.subtract(1, 'day')) && d.isBefore(today.add(1, 'day'));
    });

    const dailyRecords: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      const dateLabel = today.subtract(i, 'day').format('MM-DD');
      const record = weekRecords.find(r => r.date === date);
      const targetBed = sleepPlan?.targetBedTime || '22:30';

      let execRate = 0;
      if (record?.isCompleted) {
        const [bh, bm] = record.bedTime.split(':').map(Number);
        const [th, tm] = targetBed.split(':').map(Number);
        const diff = Math.abs((bh * 60 + bm) - (th * 60 + tm));
        if (diff <= 30) execRate = 100;
        else if (diff <= 60) execRate = 80;
        else if (diff <= 90) execRate = 60;
        else execRate = 40;
      }

      const phoneFactor = record?.factors?.find(f => f.type === 'phone');
      const sleepiness = Math.min(100, Math.max(20, 80 - (record?.sleepDuration || 5) * 5 + (phoneFactor?.value || 0) * 0.3));
      const focus = Math.min(100, Math.max(20, (record?.sleepDuration || 5) * 8 + (record?.quality || 50) * 0.3 - (phoneFactor?.value || 0) * 0.2));

      dailyRecords.push({
        date: dateLabel,
        sleepDuration: record?.sleepDuration || 0,
        quality: record?.quality || 0,
        executionRate: execRate,
        sleepiness: Math.round(sleepiness),
        focus: Math.round(focus),
      });
    }

    const completedRecords = weekRecords.filter(r => r.isCompleted);
    const avgSleep = completedRecords.length > 0
      ? Math.round(completedRecords.reduce((s, r) => s + r.sleepDuration, 0) / completedRecords.length * 10) / 10
      : 0;
    const avgQuality = completedRecords.length > 0
      ? Math.round(completedRecords.reduce((s, r) => s + r.quality, 0) / completedRecords.length)
      : 0;
    const avgExec = dailyRecords.reduce((s, d) => s + d.executionRate, 0) / 7;
    const avgSleepiness = dailyRecords.reduce((s, d) => s + d.sleepiness, 0) / 7;
    const avgFocus = dailyRecords.reduce((s, d) => s + d.focus, 0) / 7;

    return {
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: today.format('YYYY-MM-DD'),
      executionRate: Math.round(avgExec),
      avgSleepDuration: avgSleep,
      avgQuality,
      sleepinessLevel: Math.round(avgSleepiness),
      focusLevel: Math.round(avgFocus),
      dailyRecords,
    };
  },
}));
