import { create } from 'zustand';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import {
  SleepRecord, SleepPlan, Course, DormReminder,
  WeeklyStats, ScheduleMode, ConstraintConfig, ReminderConfig, SleepFactor, DailyStat, DailyPlanPreview
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
  initialized: 'sleep_initialized',
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
  isInitialized: boolean;

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
  dismissReminder: () => void;
  markInitialized: () => void;
  updateConsecutiveLateNights: () => void;
  getWeeklyStats: () => WeeklyStats;
  getWeekPreview: () => DailyPlanPreview[];
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
  isInitialized: loadFromStorage<boolean>(STORAGE_KEYS.initialized, false),

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
    const { todayRecord, currentDate, historyRecords } = get();
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

    const existingIdx = historyRecords.findIndex(r => r.date === currentDate);
    let newHistory: SleepRecord[];
    if (existingIdx >= 0) {
      newHistory = [...historyRecords];
      newHistory[existingIdx] = { ...newHistory[existingIdx], factors };
    } else {
      newHistory = [...historyRecords, updated];
    }
    if (newHistory.length > 30) {
      newHistory = newHistory.slice(-30);
    }
    set({ historyRecords: newHistory });
    saveToStorage(STORAGE_KEYS.historyRecords, newHistory);
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

  dismissReminder: () => {
    const today = dayjs().format('YYYY-MM-DD');
    const reminder = { ...get().reminder, lastTriggeredDate: today };
    set({ reminder });
    saveToStorage(STORAGE_KEYS.reminder, reminder);
  },

  markInitialized: () => {
    set({ isInitialized: true });
    saveToStorage(STORAGE_KEYS.initialized, true);
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
      let bedTotalMin = bh * 60 + (bm || 0);

      let compareThreshold = thresholdTotalMin;
      if (bh < 6 && thresholdHour >= 18) {
        bedTotalMin += 1440;
      } else if (bh >= 18 && thresholdHour < 6) {
        compareThreshold += 1440;
      }

      const isLate = bedTotalMin > compareThreshold + 30;
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

    const lateThreshold = sleepPlan?.targetBedTime || '23:00';
    const thresholdHour = parseInt(lateThreshold.split(':')[0]);
    const thresholdMinute = parseInt(lateThreshold.split(':')[1] || '0');
    let thresholdTotalMin = thresholdHour * 60 + thresholdMinute;

    const dailyRecords: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      const dateLabel = today.subtract(i, 'day').format('MM-DD');
      const record = weekRecords.find(r => r.date === date);
      const targetBed = sleepPlan?.targetBedTime || '22:30';

      let execRate = 0;
      let isLateNight = false;
      if (record?.isCompleted && record.bedTime) {
        const [bh, bm] = record.bedTime.split(':').map(Number);
        const [th, tm] = targetBed.split(':').map(Number);
        const diff = Math.abs((bh * 60 + bm) - (th * 60 + tm));
        if (diff <= 30) execRate = 100;
        else if (diff <= 60) execRate = 80;
        else if (diff <= 90) execRate = 60;
        else execRate = 40;

        let bedTotalMin = bh * 60 + (bm || 0);
        let compareThreshold = thresholdTotalMin;
        if (bh < 6 && thresholdHour >= 18) {
          bedTotalMin += 1440;
        } else if (bh >= 18 && thresholdHour < 6) {
          compareThreshold += 1440;
        }
        isLateNight = bedTotalMin > compareThreshold + 30;
      }

      const factorsList = record?.factors || [];
      const phoneFactor = factorsList.find(f => f.type === 'phone');
      const snackFactor = factorsList.find(f => f.type === 'snack');
      const napFactor = factorsList.find(f => f.type === 'nap');
      const coffeeFactor = factorsList.find(f => f.type === 'coffee');
      const stressFactor = factorsList.find(f => f.type === 'stress');
      const exerciseFactor = factorsList.find(f => f.type === 'exercise');

      let sleepiness = 80 - (record?.sleepDuration || 5) * 5;
      sleepiness += (phoneFactor?.value || 0) * 0.3;
      sleepiness += (snackFactor?.value || 0) * 8;
      sleepiness += Math.max(0, (napFactor?.value || 0) - 60) * 0.2;
      sleepiness += (coffeeFactor?.value || 0) * 4;
      sleepiness += (stressFactor?.value || 0) * 5;
      sleepiness -= (exerciseFactor?.value || 0) * 0.05;
      sleepiness = Math.min(100, Math.max(20, sleepiness));

      let focus = (record?.sleepDuration || 5) * 8 + (record?.quality || 50) * 0.3;
      focus -= (phoneFactor?.value || 0) * 0.2;
      focus -= (snackFactor?.value || 0) * 5;
      focus -= Math.max(0, (napFactor?.value || 0) - 90) * 0.2;
      focus -= (coffeeFactor?.value || 0) * 2;
      focus -= (stressFactor?.value || 0) * 4;
      focus += (exerciseFactor?.value || 0) * 0.05;
      focus = Math.min(100, Math.max(20, focus));

      const factorIcons: DailyStat['factors'] = factorsList.map(f => {
        const info = (() => {
          switch (f.type) {
            case 'phone': return { icon: '📱', label: '刷手机' };
            case 'snack': return { icon: '🍔', label: '夜宵' };
            case 'nap': return { icon: '😴', label: '补觉' };
            case 'coffee': return { icon: '☕', label: '咖啡' };
            case 'exercise': return { icon: '🏃', label: '运动' };
            case 'stress': return { icon: '😰', label: '压力' };
            default: return { icon: '📝', label: f.name || '因素' };
          }
        })();
        return {
          type: f.type,
          icon: info.icon,
          label: info.label,
          value: f.value,
          unit: f.unit,
        };
      });

      let note = '';
      if (isLateNight) note = '当日晚睡';
      else if (record?.isCompleted && execRate >= 90) note = '执行优秀';
      else if (!record?.isCompleted && factorIcons.length > 0) note = '仅记录因素';

      let explanation = '';
      if (record?.isCompleted) {
        const reasons: string[] = [];
        if (isLateNight) reasons.push('入睡时间比目标晚30分钟以上');
        if (record.sleepDuration < 6) reasons.push('睡眠时长不足6小时');
        if ((phoneFactor?.value || 0) >= 60) reasons.push('睡前刷手机1小时以上');
        if ((snackFactor?.value || 0) >= 2) reasons.push('夜宵较多');
        if ((napFactor?.value || 0) >= 90) reasons.push('白天补觉太久');
        if ((stressFactor?.value || 0) >= 4) reasons.push('压力较大');
        if (record.sleepDuration >= 7 && !isLateNight) reasons.push('睡眠充足且作息规律');
        if ((exerciseFactor?.value || 0) >= 30) reasons.push('有运动助力');
        explanation = reasons.length > 0 ? reasons.join('，') : '睡眠质量一般';
      } else if (factorIcons.length > 0) {
        explanation = `今日记录了${factorIcons.length}项影响因素，完成睡眠打卡后可看到完整分析`;
      } else {
        explanation = '今日暂无睡眠记录，完成打卡后生成分析';
      }

      dailyRecords.push({
        date: dateLabel,
        fullDate: date,
        sleepDuration: record?.sleepDuration || 0,
        quality: record?.quality || 0,
        executionRate: execRate,
        sleepiness: Math.round(sleepiness),
        focus: Math.round(focus),
        factors: factorIcons,
        isLateNight,
        note,
        explanation,
        bedTime: record?.bedTime,
        wakeTime: record?.wakeTime,
        isCompleted: record?.isCompleted || false,
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

    const lateNightCount = dailyRecords.filter(d => d.isLateNight).length;
    let consecutiveLates = 0;
    let recoveryDays = 0;
    for (let i = dailyRecords.length - 1; i >= 0; i--) {
      if (dailyRecords[i].isLateNight) consecutiveLates++;
      else break;
    }
    for (let i = dailyRecords.length - 1; i >= 0; i--) {
      if (!dailyRecords[i].isLateNight && dailyRecords[i].sleepDuration > 0) recoveryDays++;
      else if (dailyRecords[i].isLateNight) break;
    }

    let sleepAdvice = '本周作息整体平稳，继续保持规律睡眠~';
    if (consecutiveLates >= 3) {
      sleepAdvice = '🔴 已连续3晚以上晚睡，强烈建议今晚早点睡，白天补觉不超过20分钟';
    } else if (consecutiveLates >= 2) {
      sleepAdvice = '🟡 连续2晚晚睡，今晚注意控制入睡时间，白天小睡不超过30分钟';
    } else if (lateNightCount >= 3) {
      sleepAdvice = '本周晚睡较多，建议调整节奏，尽量在目标时间前后30分钟内入睡';
    } else if (recoveryDays >= 2) {
      sleepAdvice = '💚 已连续恢复规律作息2天以上，坚持下去效果更明显';
    } else if (lateNightCount === 0 && completedRecords.length >= 3) {
      sleepAdvice = '🌟 本周没有晚睡记录，作息非常规律，请继续保持！';
    }

    return {
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: today.format('YYYY-MM-DD'),
      executionRate: Math.round(avgExec),
      avgSleepDuration: avgSleep,
      avgQuality,
      sleepinessLevel: Math.round(avgSleepiness),
      focusLevel: Math.round(avgFocus),
      dailyRecords,
      lateNightCount,
      consecutiveLateNights: consecutiveLates,
      recoveryDays,
      sleepAdvice,
    };
  },

  getWeekPreview: () => {
    const { courses, scheduleMode, sleepPlan } = get();
    const preview: DailyPlanPreview[] = [];
    const today = dayjs();

    let targetBed = sleepPlan?.targetBedTime || '23:00';
    const targetBedMin = parseInt(targetBed.split(':')[0]) * 60 + parseInt(targetBed.split(':')[1] || '0');

    for (let i = 0; i < 7; i++) {
      const d = today.add(i, 'day');
      const dateStr = d.format('MM-DD');
      const weekday = d.day();
      const weekDayLabel = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekday];
      const isToday = i === 0;

      const dayCourses = courses.filter(c => c.day === weekday);
      const hasCourse = dayCourses.length > 0;

      let wakeMin: number;
      let isEarly = false;
      let earliestCourse: string | undefined;

      if (hasCourse) {
        const sorted = [...dayCourses].sort((a, b) => a.startTime.localeCompare(b.startTime));
        const first = sorted[0];
        earliestCourse = first.startTime;
        const [fh, fm] = first.startTime.split(':').map(Number);
        const firstMin = fh * 60 + fm;

        if (first.isEarly || (fh === 8 && fm <= 10)) {
          wakeMin = firstMin - 90;
          isEarly = true;
        } else {
          wakeMin = firstMin - 60;
        }
      } else {
        const isWeekend = weekday === 0 || weekday === 6;
        if (scheduleMode === 'vacation') {
          wakeMin = 9 * 60 + 30;
        } else if (scheduleMode === 'exam') {
          wakeMin = 7 * 60 + 30;
        } else {
          wakeMin = isWeekend ? 8 * 60 + 30 : 8 * 60;
        }
      }

      if (wakeMin < 0) wakeMin += 1440;
      const wakeTime = `${Math.floor(wakeMin / 60).toString().padStart(2, '0')}:${(wakeMin % 60).toString().padStart(2, '0')}`;

      let sleepDurMin: number;
      if (wakeMin >= targetBedMin) {
        sleepDurMin = wakeMin - targetBedMin;
      } else {
        sleepDurMin = wakeMin + 1440 - targetBedMin;
      }
      const sleepDuration = Math.round(sleepDurMin / 60 * 10) / 10;

      preview.push({
        date: dateStr,
        weekday,
        weekDayLabel,
        isToday,
        targetBedTime: targetBed,
        targetWakeTime: wakeTime,
        sleepDuration,
        hasCourse,
        earliestCourse,
        isEarly,
      });
    }

    return preview;
  },
}));
