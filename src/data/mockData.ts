import { SleepRecord, Course, DormMate, DormReminder, WeeklyStats, RelaxExercise, Encouragement, CareSummary } from '@/types';
import dayjs from 'dayjs';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const mockCourses: Course[] = [
  { id: generateId(), name: '高等数学', day: 1, startTime: '08:00', endTime: '09:40', location: '教学楼A101', isEarly: true },
  { id: generateId(), name: '大学英语', day: 1, startTime: '10:00', endTime: '11:40', location: '外语楼B202', isEarly: false },
  { id: generateId(), name: '程序设计', day: 2, startTime: '08:00', endTime: '09:40', location: '实验楼C301', isEarly: true },
  { id: generateId(), name: '线性代数', day: 2, startTime: '14:00', endTime: '15:40', location: '教学楼A203', isEarly: false },
  { id: generateId(), name: '物理实验', day: 3, startTime: '09:00', endTime: '11:40', location: '实验楼D101', isEarly: false },
  { id: generateId(), name: '计算机网络', day: 3, startTime: '14:00', endTime: '15:40', location: '教学楼A305', isEarly: false },
  { id: generateId(), name: '数据结构', day: 4, startTime: '08:00', endTime: '09:40', location: '教学楼A102', isEarly: true },
  { id: generateId(), name: '操作系统', day: 4, startTime: '10:00', endTime: '11:40', location: '教学楼A201', isEarly: false },
  { id: generateId(), name: '形势与政策', day: 5, startTime: '14:00', endTime: '15:40', location: '教学楼B101', isEarly: false },
];

export const mockDormMates: DormMate[] = [
  {
    id: generateId(),
    name: '小明',
    sleepSchedule: { bedTime: '23:30', wakeTime: '07:00' },
    preferences: {
      acceptHeadphone: true,
      acceptLight: 'dim',
      acceptDoorTime: '23:00',
      quietStartTime: '22:30'
    }
  },
  {
    id: generateId(),
    name: '小红',
    sleepSchedule: { bedTime: '23:00', wakeTime: '06:30' },
    preferences: {
      acceptHeadphone: true,
      acceptLight: 'off',
      acceptDoorTime: '22:30',
      quietStartTime: '22:00'
    }
  },
  {
    id: generateId(),
    name: '小刚',
    sleepSchedule: { bedTime: '24:00', wakeTime: '07:30' },
    preferences: {
      acceptHeadphone: true,
      acceptLight: 'normal',
      acceptDoorTime: '23:30',
      quietStartTime: '23:00'
    }
  }
];

export const mockDormReminders: DormReminder[] = [
  {
    id: generateId(),
    type: 'headphone',
    message: '麻烦带一下耳机哦，我准备睡了~',
    senderId: '1',
    senderName: '小红',
    timestamp: dayjs().subtract(1, 'hour').toISOString(),
    isAnonymous: false
  },
  {
    id: generateId(),
    type: 'light',
    message: '可以调暗一点灯光吗？谢谢！',
    senderId: '2',
    senderName: '匿名室友',
    timestamp: dayjs().subtract(3, 'hour').toISOString(),
    isAnonymous: true
  }
];

export const mockTodayRecord: SleepRecord = {
  id: generateId(),
  date: dayjs().format('YYYY-MM-DD'),
  bedTime: '23:15',
  wakeTime: '06:45',
  sleepDuration: 7.5,
  quality: 85,
  factors: [
    { id: generateId(), name: '睡前刷手机', type: 'phone', value: 45, unit: '分钟' },
    { id: generateId(), name: '白天补觉', type: 'nap', value: 30, unit: '分钟' }
  ],
  isCompleted: true
};

export const mockWeeklyStats: WeeklyStats = {
  weekStart: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  weekEnd: dayjs().format('YYYY-MM-DD'),
  executionRate: 78,
  avgSleepDuration: 7.2,
  avgQuality: 76,
  sleepinessLevel: 62,
  focusLevel: 68,
  lateNightCount: 2,
  consecutiveLateNights: 0,
  recoveryDays: 2,
  sleepAdvice: '本周作息整体平稳，继续保持规律睡眠~',
  dailyRecords: [
    { date: dayjs().subtract(6, 'day').format('MM-DD'), sleepDuration: 7.5, quality: 80, executionRate: 85, sleepiness: 55, focus: 75, factors: [], isLateNight: false },
    { date: dayjs().subtract(5, 'day').format('MM-DD'), sleepDuration: 6.8, quality: 72, executionRate: 70, sleepiness: 68, focus: 62, factors: [], isLateNight: true },
    { date: dayjs().subtract(4, 'day').format('MM-DD'), sleepDuration: 8.0, quality: 88, executionRate: 95, sleepiness: 45, focus: 85, factors: [], isLateNight: false },
    { date: dayjs().subtract(3, 'day').format('MM-DD'), sleepDuration: 6.5, quality: 68, executionRate: 65, sleepiness: 75, focus: 55, factors: [], isLateNight: true },
    { date: dayjs().subtract(2, 'day').format('MM-DD'), sleepDuration: 7.0, quality: 75, executionRate: 80, sleepiness: 60, focus: 70, factors: [], isLateNight: false },
    { date: dayjs().subtract(1, 'day').format('MM-DD'), sleepDuration: 7.2, quality: 78, executionRate: 82, sleepiness: 58, focus: 72, factors: [], isLateNight: false },
    { date: dayjs().format('MM-DD'), sleepDuration: 7.5, quality: 85, executionRate: 90, sleepiness: 50, focus: 80, factors: [], isLateNight: false }
  ]
};

export const mockRelaxExercises: RelaxExercise[] = [
  {
    id: generateId(),
    name: '4-7-8 呼吸法',
    duration: 10,
    type: 'breathing',
    description: '通过调节呼吸节奏，快速放松身心，帮助入睡',
    steps: [
      '用鼻子安静地吸气，数到4',
      '屏住呼吸，数到7',
      '用嘴慢慢呼气，数到8',
      '重复以上循环，持续10分钟'
    ]
  },
  {
    id: generateId(),
    name: '渐进式肌肉放松',
    duration: 10,
    type: 'muscle',
    description: '通过有意识地绷紧和放松肌肉，释放身体紧张',
    steps: [
      '仰卧，闭上眼睛',
      '从脚趾开始，用力绷紧5秒，然后放松10秒',
      '依次向上移动：小腿、大腿、腹部、胸部、手臂、肩膀、脸部',
      '完成后深呼吸几次，感受全身放松的状态'
    ]
  },
  {
    id: generateId(),
    name: '脑内清单清空',
    duration: 5,
    type: 'thought',
    description: '将脑海中的杂念写出来，清空大脑，轻松入睡',
    steps: [
      '准备好纸笔或手机备忘录',
      '把明天需要做的事情全部列出来',
      '把担心的事情也写下来，告诉自己"明天再处理"',
      '深呼吸，感受大脑逐渐清空的宁静'
    ]
  },
  {
    id: generateId(),
    name: '正念冥想',
    duration: 10,
    type: 'meditation',
    description: '专注当下，减少杂念，培养内心的平静',
    steps: [
      '找一个舒适的姿势坐下或躺下',
      '将注意力集中在呼吸上',
      '当思绪飘走时，温柔地将注意力带回到呼吸',
      '不评判，不抗拒，只是观察'
    ]
  }
];

export const mockEncouragements: Encouragement[] = [
  { id: generateId(), content: '坚持就是胜利，你的努力一定会有回报的！', timestamp: dayjs().subtract(2, 'hour').toISOString(), isAnonymous: true },
  { id: generateId(), content: '今晚早点睡，明天又是元气满满的一天~', timestamp: dayjs().subtract(5, 'hour').toISOString(), isAnonymous: false, senderName: '小明' },
  { id: generateId(), content: '考试周加油！考完就可以好好休息了', timestamp: dayjs().subtract(1, 'day').toISOString(), isAnonymous: true },
  { id: generateId(), content: '睡眠是最好的复习方式，相信自己！', timestamp: dayjs().subtract(2, 'day').toISOString(), isAnonymous: false, senderName: '小红' }
];

export const mockCareSummary: CareSummary = {
  period: '近7天',
  avgSleep: 7.2,
  regularity: 78,
  healthStatus: 'normal',
  suggestion: '整体睡眠状况良好，建议保持规律作息，减少睡前使用手机的时间。'
};

export const getSleepQualityTip = (quality: number): string => {
  if (quality >= 90) return '睡眠质量很棒！继续保持~';
  if (quality >= 75) return '睡眠质量不错，可以再优化一些细节';
  if (quality >= 60) return '睡眠质量一般，建议调整睡前习惯';
  return '睡眠质量需要改善，试试我们的放松训练吧';
};

export const getExecutionRateTip = (rate: number): string => {
  if (rate >= 90) return '执行率优秀！你的自律让人佩服';
  if (rate >= 75) return '执行率良好，继续加油';
  if (rate >= 60) return '执行率一般，可以试试设置更多提醒';
  return '执行率有待提高，从小目标开始吧';
};
