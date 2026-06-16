export interface SleepRecord {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  sleepDuration: number;
  quality: number;
  factors: SleepFactor[];
  isCompleted: boolean;
}

export interface SleepFactor {
  id: string;
  name: string;
  type: 'phone' | 'snack' | 'nap' | 'coffee' | 'exercise' | 'stress' | 'other';
  value: number;
  unit: string;
}

export interface Course {
  id: string;
  name: string;
  day: number;
  startTime: string;
  endTime: string;
  location: string;
  isEarly: boolean;
}

export interface SleepPlan {
  id: string;
  mode: 'normal' | 'exam' | 'vacation';
  targetBedTime: string;
  targetWakeTime: string;
  targetDuration: number;
  flexibleWindow: {
    minBedTime: string;
    maxBedTime: string;
    minWakeTime: string;
    maxWakeTime: string;
  };
  constraints: PlanConstraint[];
}

export interface PlanConstraint {
  id: string;
  type: 'curfew' | 'duty' | 'lateReturn' | 'earlyClass' | 'other';
  name: string;
  startTime: string;
  endTime: string;
  day: number[];
}

export interface ConstraintConfig {
  id: string;
  type: 'curfew' | 'duty' | 'lateReturn';
  name: string;
  icon: string;
  time: string;
  color: string;
  bgColor: string;
  enabled: boolean;
}

export interface ReminderConfig {
  enabled: boolean;
  minutesBefore: number;
  reminderTime: string;
  lastTriggeredDate: string;
}

export interface DormMate {
  id: string;
  name: string;
  avatar?: string;
  sleepSchedule: {
    bedTime: string;
    wakeTime: string;
  };
  preferences: DormPreference;
}

export interface DormPreference {
  acceptHeadphone: boolean;
  acceptLight: 'off' | 'dim' | 'normal';
  acceptDoorTime: string;
  quietStartTime: string;
}

export interface DormReminder {
  id: string;
  type: 'headphone' | 'light' | 'door' | 'quiet';
  message: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isAnonymous: boolean;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  executionRate: number;
  avgSleepDuration: number;
  avgQuality: number;
  sleepinessLevel: number;
  focusLevel: number;
  dailyRecords: DailyStat[];
  lateNightCount: number;
  consecutiveLateNights: number;
  recoveryDays: number;
  sleepAdvice: string;
}

export interface DailyStat {
  date: string;
  sleepDuration: number;
  quality: number;
  executionRate: number;
  sleepiness: number;
  focus: number;
  factors: { type: string; icon: string; label: string; value: number; unit: string }[];
  isLateNight: boolean;
  note?: string;
}

export interface RelaxExercise {
  id: string;
  name: string;
  duration: number;
  type: 'breathing' | 'meditation' | 'muscle' | 'thought';
  description: string;
  steps: string[];
}

export interface Encouragement {
  id: string;
  content: string;
  timestamp: string;
  isAnonymous: boolean;
  senderName?: string;
}

export interface CareSummary {
  period: string;
  avgSleep: number;
  regularity: number;
  healthStatus: 'good' | 'normal' | 'warning';
  suggestion: string;
}

export type ScheduleMode = 'normal' | 'exam' | 'vacation';
