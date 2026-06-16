import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import dayjs from 'dayjs';
import classnames from 'classnames';

import SleepCard from '@/components/SleepCard';
import StatCard from '@/components/StatCard';
import HabitTag from '@/components/HabitTag';

import { useSleepStore } from '@/store/sleepStore';
import { mockTodayRecord, mockCourses } from '@/data/mockData';
import { getModeLabel, getFactorLabel, calculateExecutionRate, getNapSuggestion } from '@/utils/sleepAlgorithm';

const factorOptions = [
  { type: 'phone', value: 45 },
  { type: 'snack', value: 1 },
  { type: 'nap', value: 30 },
  { type: 'coffee', value: 2 },
  { type: 'stress', value: 3 },
  { type: 'exercise', value: 30 },
];

const HomePage: React.FC = () => {
  const {
    scheduleMode, sleepPlan, todayRecord, consecutiveLateNights,
    reminder, setReminderEnabled, setReminderMinutesBefore, dismissReminder,
    setTodayRecord, generateSleepPlan, updateCourses,
    checkInSleep, updateTodayFactors, updateConsecutiveLateNights,
    getWeeklyStats, isInitialized, markInitialized,
  } = useSleepStore();

  const [currentTime, setCurrentTime] = useState(dayjs());
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinBedTime, setCheckinBedTime] = useState('23:00');
  const [checkinWakeTime, setCheckinWakeTime] = useState('07:00');
  const [showReminderAlert, setShowReminderAlert] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      updateCourses(mockCourses);
      setTodayRecord(mockTodayRecord);
      generateSleepPlan();
      markInitialized();
    }
    if (!sleepPlan) {
      generateSleepPlan();
    }
    updateConsecutiveLateNights();

    const timer = setInterval(() => {
      setCurrentTime(dayjs());
      checkReminderTrigger();
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (todayRecord?.factors) {
      setSelectedFactors(todayRecord.factors.map(f => f.type));
    }
  }, []);

  useDidShow(() => {
    checkReminderTrigger();
  });

  const checkReminderTrigger = () => {
    if (!reminder.enabled || !reminder.reminderTime) return;
    const now = dayjs();
    const reminderDate = now.format('YYYY-MM-DD');
    if (reminder.lastTriggeredDate === reminderDate) return;

    const nowMinutes = now.hour() * 60 + now.minute();
    const [rh, rm] = reminder.reminderTime.split(':').map(Number);
    const reminderMinutes = rh * 60 + rm;
    if (nowMinutes >= reminderMinutes) {
      setShowReminderAlert(true);
    }
  };

  const greeting = useMemo(() => {
    const hour = currentTime.hour();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, [currentTime]);

  const dateDisplay = useMemo(() => {
    return currentTime.format('YYYY年MM月DD日 dddd');
  }, [currentTime]);

  const targetBedTime = sleepPlan?.targetBedTime || '22:30';
  const targetWakeTime = sleepPlan?.targetWakeTime || '06:30';

  const countdown = useMemo(() => {
    const now = dayjs(`2000-01-01 ${currentTime.format('HH:mm')}`);
    let target = dayjs(`2000-01-01 ${targetBedTime}`);
    if (now.isAfter(target)) {
      target = target.add(1, 'day');
    }
    const diff = target.diff(now);
    if (diff <= 0) return '已过入睡时间';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  }, [currentTime, targetBedTime]);

  const executionRate = todayRecord?.isCompleted
    ? calculateExecutionRate(todayRecord.bedTime, targetBedTime)
    : 0;

  const weeklyStats = getWeeklyStats();

  const handleFactorToggle = (type: string) => {
    const newSelected = selectedFactors.includes(type)
      ? selectedFactors.filter(f => f !== type)
      : [...selectedFactors, type];
    setSelectedFactors(newSelected);

    const factors = newSelected.map(t => {
      const opt = factorOptions.find(o => o.type === t);
      const info = getFactorLabel(t);
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: info.label,
        type: t as any,
        value: opt?.value || 0,
        unit: t === 'stress' ? '级' : (t === 'snack' || t === 'coffee') ? '次' : '分钟',
      };
    });
    updateTodayFactors(factors);
  };

  const handleCheckin = () => {
    setShowCheckinModal(true);
  };

  const handleConfirmCheckin = () => {
    checkInSleep(checkinBedTime, checkinWakeTime);
    setShowCheckinModal(false);
    Taro.showToast({ title: '打卡成功！', icon: 'success' });
  };

  const handleReminderToggle = () => {
    setReminderEnabled(!reminder.enabled);
    if (!reminder.enabled) {
      Taro.showToast({ title: '降噪提醒已开启', icon: 'success' });
    }
  };

  const handleDismissReminderAlert = () => {
    dismissReminder();
    setShowReminderAlert(false);
  };

  const handleActionClick = (action: string) => {
    const routes: Record<string, string> = {
      relax: '/pages/focus/index',
      clear: '/pages/focus/index',
      dorm: '/pages/dorm/index',
      plan: '/pages/plan/index',
      report: '/pages/report/index',
    };
    if (routes[action]) {
      Taro.switchTab({ url: routes[action] });
    }
  };

  const sleepRecord = todayRecord || mockTodayRecord;

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <View className={styles.greeting}>
          <Text className={styles.greetingText}>{greeting}，同学</Text>
          <Text className={styles.dateText}>{dateDisplay}</Text>
        </View>
        <View className={styles.modeBadge}>
          <Text className={styles.modeText}>{getModeLabel(scheduleMode)}</Text>
        </View>
      </View>

      <SleepCard
        className={styles.sleepCard}
        bedTime={sleepRecord.bedTime}
        wakeTime={sleepRecord.wakeTime}
        duration={sleepRecord.sleepDuration}
        quality={sleepRecord.quality}
      />

      <View className={styles.planCard}>
        <View className={styles.planHeader}>
          <Text className={styles.planTitle}>📋 今日睡眠计划</Text>
          <View className={styles.countdown}>
            <Text className={styles.countdownIcon}>⏰</Text>
            <Text className={styles.countdownText}>距入睡 {countdown}</Text>
          </View>
        </View>
        <View className={styles.planContent}>
          <View className={styles.planTimeItem}>
            <Text className={styles.planTimeLabel}>目标入睡</Text>
            <Text className={styles.planTimeValue}>{targetBedTime}</Text>
          </View>
          <View className={styles.planDivider} />
          <View className={styles.planTimeItem}>
            <Text className={styles.planTimeLabel}>目标起床</Text>
            <Text className={styles.planTimeValue}>{targetWakeTime}</Text>
          </View>
        </View>
      </View>

      <View className={styles.reminderCard}>
        <View className={styles.reminderHeader}>
          <View className={styles.reminderInfo}>
            <Text className={styles.reminderIcon}>🔕</Text>
            <Text className={styles.reminderLabel}>睡前降噪提醒</Text>
          </View>
          <View
            className={classnames(styles.reminderToggle, reminder.enabled && styles.active)}
            onClick={handleReminderToggle}
          >
            <View className={styles.reminderToggleDot} />
          </View>
        </View>
        {reminder.enabled && (
          <View className={styles.reminderDetail}>
            <Text className={styles.reminderTime}>
              提醒时间：{reminder.reminderTime || '未设置'}（入睡前{reminder.minutesBefore}分钟）
            </Text>
            <View className={styles.reminderMinutes}>
              {[15, 30, 45].map(m => (
                <View
                  key={m}
                  className={classnames(styles.minuteOption, reminder.minutesBefore === m && styles.minuteActive)}
                  onClick={() => setReminderMinutesBefore(m)}
                >
                  <Text className={styles.minuteText}>{m}分钟前</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <Button className={styles.checkinButton} onClick={handleCheckin}>
        ✨ 记录昨晚睡眠
      </Button>

      <View className={styles.statsGrid}>
        <StatCard
          icon="✅"
          label="执行率"
          value={executionRate}
          unit="%"
          trend={executionRate >= 75 ? 'up' : executionRate >= 60 ? 'neutral' : 'down'}
          trendValue="较昨日"
          color="#22C55E"
        />
        <StatCard
          icon="😴"
          label="困倦度"
          value={weeklyStats.sleepinessLevel}
          unit="%"
          trend="down"
          trendValue="较昨日"
          color="#F59E0B"
        />
        <StatCard
          icon="🎯"
          label="专注感"
          value={weeklyStats.focusLevel}
          unit="%"
          trend="up"
          trendValue="较昨日"
          color="#5B6DF0"
        />
      </View>

      {consecutiveLateNights >= 2 && (
        <View className={styles.warningCard}>
          <Text className={styles.warningIcon}>⚠️</Text>
          <View className={styles.warningContent}>
            <Text className={styles.warningTitle}>
              {consecutiveLateNights >= 3 ? '🔴 严重补眠提醒' : '🟡 补眠建议'}
            </Text>
            <Text className={styles.warningText}>{getNapSuggestion(consecutiveLateNights)}</Text>
            {consecutiveLateNights >= 3 && (
              <Text className={styles.warningSubtext}>
                连续{consecutiveLateNights}晚晚睡，请优先恢复规律作息
              </Text>
            )}
          </View>
        </View>
      )}

      <View className={styles.factorsSection}>
        <Text className={styles.sectionTitle}>📝 记录影响因素</Text>
        <View className={styles.factorsGrid}>
          {factorOptions.map(({ type, value }) => {
            const factor = getFactorLabel(type);
            return (
              <HabitTag
                key={type}
                icon={factor.icon}
                label={factor.label}
                value={`${value}${type === 'stress' ? '级' : type === 'snack' || type === 'coffee' ? '次' : '分钟'}`}
                color={factor.color}
                active={selectedFactors.includes(type) || (todayRecord?.factors?.some(f => f.type === type) ?? false)}
                onClick={() => handleFactorToggle(type)}
              />
            );
          })}
        </View>
      </View>

      <View className={styles.quickActions}>
        <Text className={styles.sectionTitle}>⚡ 快捷功能</Text>
        <View className={styles.actionGrid}>
          <View className={styles.actionCard} onClick={() => handleActionClick('relax')}>
            <Text className={styles.actionIcon}>🧘</Text>
            <Text className={styles.actionName}>放松练习</Text>
          </View>
          <View className={styles.actionCard} onClick={() => handleActionClick('clear')}>
            <Text className={styles.actionIcon}>📝</Text>
            <Text className={styles.actionName}>清单清空</Text>
          </View>
          <View className={styles.actionCard} onClick={() => handleActionClick('dorm')}>
            <Text className={styles.actionIcon}>🏠</Text>
            <Text className={styles.actionName}>宿舍协同</Text>
          </View>
        </View>
      </View>

      {showCheckinModal && (
        <View className={styles.modalOverlay} onClick={() => setShowCheckinModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>记录昨晚睡眠</Text>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>昨晚入睡时间</Text>
              <Input
                className={styles.formInput}
                value={checkinBedTime}
                onInput={(e) => setCheckinBedTime(e.detail.value)}
                placeholder="如 23:30"
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>今早起床时间</Text>
              <Input
                className={styles.formInput}
                value={checkinWakeTime}
                onInput={(e) => setCheckinWakeTime(e.detail.value)}
                placeholder="如 07:00"
              />
            </View>
            <View className={styles.modalButtons}>
              <Button className={styles.modalCancel} onClick={() => setShowCheckinModal(false)}>取消</Button>
              <Button className={styles.modalConfirm} onClick={handleConfirmCheckin}>确认打卡</Button>
            </View>
          </View>
        </View>
      )}

      {showReminderAlert && (
        <View className={styles.reminderAlertOverlay}>
          <View className={styles.reminderAlert}>
            <Text className={styles.reminderAlertIcon}>🔕</Text>
            <Text className={styles.reminderAlertTitle}>降噪提醒</Text>
            <Text className={styles.reminderAlertText}>
              距离目标入睡时间还有{reminder.minutesBefore}分钟，请开始准备入睡，减少噪音和光线刺激
            </Text>
            <Button className={styles.reminderAlertBtn} onClick={handleDismissReminderAlert}>知道了，准备入睡</Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default HomePage;
