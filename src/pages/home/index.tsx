import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import dayjs from 'dayjs';


import SleepCard from '@/components/SleepCard';
import StatCard from '@/components/StatCard';
import HabitTag from '@/components/HabitTag';

import { useSleepStore } from '@/store/sleepStore';
import { mockTodayRecord, mockWeeklyStats, mockCourses } from '@/data/mockData';
import { getModeLabel, getFactorLabel, calculateExecutionRate, getNapSuggestion } from '@/utils/sleepAlgorithm';


const HomePage: React.FC = () => {
  const { scheduleMode, consecutiveLateNights, setTodayRecord, generateSleepPlan, updateCourses } = useSleepStore();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  const sleepRecord = mockTodayRecord;
  const weeklyStats = mockWeeklyStats;

  useEffect(() => {
    updateCourses(mockCourses);
    generateSleepPlan();
    setTodayRecord(mockTodayRecord);
    
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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

  const targetBedTime = dayjs(`2000-01-01 22:30`);
  const countdown = useMemo(() => {
    const now = dayjs(`2000-01-01 ${currentTime.format('HH:mm')}`);
    let target = targetBedTime;
    if (now.isAfter(target)) {
      target = target.add(1, 'day');
    }
    const diff = target.diff(now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  }, [currentTime, targetBedTime]);

  const executionRate = calculateExecutionRate(sleepRecord.bedTime, '22:30');

  const factorOptions = [
    { type: 'phone', value: 45 },
    { type: 'snack', value: 1 },
    { type: 'nap', value: 30 },
    { type: 'coffee', value: 2 },
    { type: 'stress', value: 3 },
    { type: 'exercise', value: 30 }
  ];

  const handleFactorToggle = (type: string) => {
    setSelectedFactors(prev => 
      prev.includes(type) 
        ? prev.filter(f => f !== type)
        : [...prev, type]
    );
  };

  const handleCheckin = () => {
    Taro.showToast({
      title: '打卡成功！',
      icon: 'success'
    });
    console.log('[Home] Sleep check-in completed');
  };

  const handleActionClick = (action: string) => {
    const routes: Record<string, string> = {
      relax: '/pages/focus/index',
      clear: '/pages/focus/index',
      dorm: '/pages/dorm/index',
      plan: '/pages/plan/index',
      report: '/pages/report/index'
    };
    if (routes[action]) {
      Taro.switchTab({ url: routes[action] });
    }
  };

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
            <Text className={styles.planTimeValue}>22:30</Text>
          </View>
          <View className={styles.planDivider} />
          <View className={styles.planTimeItem}>
            <Text className={styles.planTimeLabel}>目标起床</Text>
            <Text className={styles.planTimeValue}>06:30</Text>
          </View>
        </View>
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
            <Text className={styles.warningTitle}>补眠提醒</Text>
            <Text className={styles.warningText}>{getNapSuggestion(consecutiveLateNights)}</Text>
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
                active={selectedFactors.includes(type)}
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
    </ScrollView>
  );
};

export default HomePage;
