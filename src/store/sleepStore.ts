import { create } from 'zustand';
import { SleepRecord, SleepPlan, Course, DormMate, DormReminder, WeeklyStats, RelaxExercise, Encouragement, CareSummary, ScheduleMode } from '@/types';

interface SleepState {
  currentDate: string;
  todayRecord: SleepRecord | null;
  sleepPlan: SleepPlan | null;
  scheduleMode: ScheduleMode;
  courses: Course[];
  dormMates: DormMate[];
  dormReminders: DormReminder[];
  weeklyStats: WeeklyStats | null;
  relaxExercises: RelaxExercise[];
  encouragements: Encouragement[];
  careSummary: CareSummary | null;
  consecutiveLateNights: number;
  showNapWarning: boolean;
  
  setScheduleMode: (mode: ScheduleMode) => void;
  setTodayRecord: (record: SleepRecord) => void;
  addSleepFactor: (factor: SleepRecord['factors'][0]) => void;
  addDormReminder: (reminder: DormReminder) => void;
  addEncouragement: (encouragement: Encouragement) => void;
  updateCourses: (courses: Course[]) => void;
  generateSleepPlan: () => void;
  checkNapWarning: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useSleepStore = create<SleepState>((set, get) => ({
  currentDate: new Date().toISOString().split('T')[0],
  todayRecord: null,
  sleepPlan: null,
  scheduleMode: 'normal',
  courses: [],
  dormMates: [],
  dormReminders: [],
  weeklyStats: null,
  relaxExercises: [],
  encouragements: [],
  careSummary: null,
  consecutiveLateNights: 0,
  showNapWarning: false,

  setScheduleMode: (mode) => {
    set({ scheduleMode: mode });
    get().generateSleepPlan();
  },

  setTodayRecord: (record) => {
    set({ todayRecord: record });
    console.log('[SleepStore] Today record updated', record);
  },

  addSleepFactor: (factor) => {
    const { todayRecord } = get();
    if (todayRecord) {
      const updated = {
        ...todayRecord,
        factors: [...todayRecord.factors, factor]
      };
      set({ todayRecord: updated });
      console.log('[SleepStore] Factor added', factor);
    }
  },

  addDormReminder: (reminder) => {
    set((state) => ({
      dormReminders: [reminder, ...state.dormReminders]
    }));
    console.log('[SleepStore] Dorm reminder added', reminder);
  },

  addEncouragement: (encouragement) => {
    set((state) => ({
      encouragements: [encouragement, ...state.encouragements]
    }));
    console.log('[SleepStore] Encouragement added', encouragement);
  },

  updateCourses: (courses) => {
    set({ courses });
    get().generateSleepPlan();
    console.log('[SleepStore] Courses updated', courses);
  },

  generateSleepPlan: () => {
    const { scheduleMode, courses } = get();
    
    const hasEarlyClass = courses.some(c => c.isEarly && c.day >= 1 && c.day <= 5);
    
    let targetBedTime = '23:00';
    let targetWakeTime = '07:00';
    let targetDuration = 8;
    
    if (scheduleMode === 'exam') {
      targetBedTime = '24:00';
      targetWakeTime = '06:30';
      targetDuration = 6.5;
    } else if (scheduleMode === 'vacation') {
      targetBedTime = '01:00';
      targetWakeTime = '09:00';
      targetDuration = 8;
    } else if (hasEarlyClass) {
      targetWakeTime = '06:30';
      targetBedTime = '22:30';
      targetDuration = 8;
    }
    
    const plan: SleepPlan = {
      id: generateId(),
      mode: scheduleMode,
      targetBedTime,
      targetWakeTime,
      targetDuration,
      flexibleWindow: {
        minBedTime: scheduleMode === 'exam' ? '23:00' : '22:00',
        maxBedTime: scheduleMode === 'vacation' ? '02:00' : '24:00',
        minWakeTime: scheduleMode === 'vacation' ? '08:00' : '06:00',
        maxWakeTime: scheduleMode === 'vacation' ? '10:00' : '08:00'
      },
      constraints: []
    };
    
    set({ sleepPlan: plan });
    console.log('[SleepStore] Sleep plan generated', plan);
  },

  checkNapWarning: () => {
    const { consecutiveLateNights } = get();
    if (consecutiveLateNights >= 2) {
      set({ showNapWarning: true });
      console.log('[SleepStore] Nap warning triggered');
    }
  }
}));
