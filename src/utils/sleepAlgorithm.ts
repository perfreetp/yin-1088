import dayjs from 'dayjs';
import { Course, SleepPlan, PlanConstraint, ScheduleMode, ConstraintConfig } from '@/types';

export const calculateSleepDuration = (bedTime: string, wakeTime: string): number => {
  const bed = dayjs(`2000-01-01 ${bedTime}`);
  let wake = dayjs(`2000-01-01 ${wakeTime}`);
  if (wake.isBefore(bed)) {
    wake = wake.add(1, 'day');
  }
  return wake.diff(bed, 'hour', true);
};

export const generateWakeTime = (courses: Course[], day: number): string => {
  const dayCourses = courses.filter(c => c.day === day);
  if (dayCourses.length === 0) {
    return '08:00';
  }
  const earliestCourse = dayCourses.reduce((earliest, current) => {
    return current.startTime < earliest.startTime ? current : earliest;
  });
  const wakeTime = dayjs(`2000-01-01 ${earliestCourse.startTime}`)
    .subtract(90, 'minute')
    .format('HH:mm');
  return wakeTime;
};

export const generateBedTime = (wakeTime: string, targetDuration: number = 8): string => {
  const bedTime = dayjs(`2000-01-01 ${wakeTime}`)
    .subtract(targetDuration, 'hour')
    .format('HH:mm');
  return bedTime;
};

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const generateSleepPlan = (
  courses: Course[],
  mode: ScheduleMode,
  constraints: ConstraintConfig[] = []
): SleepPlan => {
  const today = dayjs().day() || 7;
  const targetWakeTime = generateWakeTime(courses, today);

  let targetDuration = 8;
  let minBedTime = '22:00';
  let maxBedTime = '24:00';
  let minWakeTime = '06:00';
  let maxWakeTime = '08:00';

  if (mode === 'exam') {
    targetDuration = 6.5;
    minBedTime = '23:00';
    maxBedTime = '01:00';
    minWakeTime = '06:00';
    maxWakeTime = '07:30';
  } else if (mode === 'vacation') {
    targetDuration = 8;
    minBedTime = '23:00';
    maxBedTime = '02:00';
    minWakeTime = '08:00';
    maxWakeTime = '10:00';
  }

  let targetBedTime = generateBedTime(targetWakeTime, targetDuration);

  const hasEarlyClass = courses.some(c => c.isEarly && c.day >= 1 && c.day <= 5);
  if (hasEarlyClass && mode === 'normal') {
    const earlyWakeTime = generateWakeTime(courses, today);
    const earlyBedTime = generateBedTime(earlyWakeTime, targetDuration);
    if (timeToMinutes(earlyBedTime) < timeToMinutes(targetBedTime)) {
      targetBedTime = earlyBedTime;
    }
  }

  let bedTimeMin = timeToMinutes(targetBedTime);

  const lateReturn = constraints.find(c => c.type === 'lateReturn');
  if (lateReturn) {
    const returnTime = lateReturn.time;
    const returnMin = timeToMinutes(returnTime);
    if (returnMin > bedTimeMin) {
      bedTimeMin = returnMin;
      targetBedTime = minutesToTime(bedTimeMin);
    }
    if (returnMin > timeToMinutes(minBedTime)) {
      minBedTime = returnTime;
    }
  }

  const curfew = constraints.find(c => c.type === 'curfew');
  if (curfew) {
    const curfewTime = curfew.time;
    const curfewMin = timeToMinutes(curfewTime);
    if (curfewMin < timeToMinutes(maxBedTime)) {
      maxBedTime = curfewTime;
    }
    if (bedTimeMin > curfewMin) {
      targetBedTime = minutesToTime(bedTimeMin);
    } else if (bedTimeMin < curfewMin) {
      const adjustedBed = Math.max(bedTimeMin, curfewMin - 30);
      targetBedTime = minutesToTime(adjustedBed);
    }
  }

  const duty = constraints.find(c => c.type === 'duty');
  if (duty) {
    const parts = duty.time.split('-');
    if (parts.length === 2) {
      const dutyEndMin = timeToMinutes(parts[1]);
      if (dutyEndMin > bedTimeMin) {
        bedTimeMin = dutyEndMin;
        targetBedTime = minutesToTime(bedTimeMin);
      }
      if (dutyEndMin > timeToMinutes(minBedTime)) {
        minBedTime = parts[1];
      }
    }
  }

  const actualDuration = calculateSleepDuration(targetBedTime, targetWakeTime);
  if (actualDuration < 5 && mode !== 'exam') {
    const adjustedBed = timeToMinutes(targetWakeTime) - 5 * 60;
    if (adjustedBed >= 0) {
      targetBedTime = minutesToTime(adjustedBed % (24 * 60));
    }
  }

  const planConstraints: PlanConstraint[] = constraints.map(c => {
    const parts = c.time.split('-');
    return {
      id: c.id,
      type: c.type,
      name: c.name,
      startTime: parts[0],
      endTime: parts.length > 1 ? parts[1] : parts[0],
      day: [today],
    };
  });

  return {
    id: Math.random().toString(36).substring(2, 9),
    mode,
    targetBedTime,
    targetWakeTime,
    targetDuration: Math.round(calculateSleepDuration(targetBedTime, targetWakeTime) * 10) / 10,
    flexibleWindow: {
      minBedTime,
      maxBedTime,
      minWakeTime,
      maxWakeTime,
    },
    constraints: planConstraints,
  };
};

export const calculateExecutionRate = (actual: string, target: string, tolerance: number = 30): number => {
  const actualTime = dayjs(`2000-01-01 ${actual}`);
  const targetTime = dayjs(`2000-01-01 ${target}`);
  const diff = Math.abs(actualTime.diff(targetTime, 'minute'));
  if (diff <= tolerance) return 100;
  if (diff <= tolerance * 2) return 80;
  if (diff <= tolerance * 3) return 60;
  if (diff <= tolerance * 4) return 40;
  return 20;
};

export const getSleepQualityScore = (duration: number, factors: { type: string; value: number }[]): number => {
  let score = 100;
  if (duration < 6) score -= 30;
  else if (duration < 7) score -= 15;
  else if (duration > 9) score -= 10;
  factors.forEach(factor => {
    switch (factor.type) {
      case 'phone':
        if (factor.value > 30) score -= Math.min(factor.value * 0.3, 20);
        break;
      case 'snack':
        if (factor.value > 0) score -= 10;
        break;
      case 'nap':
        if (factor.value > 60) score -= 15;
        break;
      case 'coffee':
        if (factor.value > 2) score -= 20;
        break;
      case 'stress':
        score -= Math.min(factor.value * 5, 25);
        break;
    }
  });
  return Math.max(0, Math.min(100, score));
};

export const shouldLimitNap = (consecutiveLateNights: number, napDuration: number): boolean => {
  if (consecutiveLateNights >= 2 && napDuration > 30) return true;
  return false;
};

export const getNapSuggestion = (consecutiveLateNights: number): string => {
  if (consecutiveLateNights >= 3) {
    return '连续熬夜3天以上，建议白天补觉不超过20分钟，避免影响夜间睡眠';
  } else if (consecutiveLateNights >= 2) {
    return '连续熬夜2天，建议白天小睡控制在30分钟内';
  }
  return '白天可适当休息，建议不超过45分钟';
};

export const formatTimeDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  if (h === 0) return `00:${minutes}`;
  if (h > 24) return `${h - 24}:${minutes}(+1)`;
  return time;
};

export const getModeLabel = (mode: ScheduleMode): string => {
  const labels: Record<ScheduleMode, string> = {
    normal: '常规模式',
    exam: '考试周模式',
    vacation: '假期模式',
  };
  return labels[mode];
};

export const getFactorLabel = (type: string): { label: string; icon: string; color: string } => {
  const factorMap: Record<string, { label: string; icon: string; color: string }> = {
    phone: { label: '睡前刷手机', icon: '📱', color: '#F59E0B' },
    snack: { label: '夜宵', icon: '🍔', color: '#EF4444' },
    nap: { label: '白天补觉', icon: '😴', color: '#8B5CF6' },
    coffee: { label: '咖啡/茶饮', icon: '☕', color: '#92400E' },
    exercise: { label: '晚间运动', icon: '🏃', color: '#22C55E' },
    stress: { label: '压力指数', icon: '😰', color: '#EC4899' },
    other: { label: '其他因素', icon: '📝', color: '#6B7280' },
  };
  return factorMap[type] || factorMap.other;
};
