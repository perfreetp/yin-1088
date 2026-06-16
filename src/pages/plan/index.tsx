import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useSleepStore } from '@/store/sleepStore';
import { mockCourses } from '@/data/mockData';
import { generateSleepPlan as genPlan, getModeLabel, getFactorLabel } from '@/utils/sleepAlgorithm';
import { ScheduleMode } from '@/types';

const modes: { key: ScheduleMode; label: string; icon: string }[] = [
  { key: 'normal', label: '常规', icon: '📅' },
  { key: 'exam', label: '考试周', icon: '📚' },
  { key: 'vacation', label: '假期', icon: '🌴' }
];

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const constraintsData = [
  { id: '1', type: 'curfew', name: '宿舍熄灯', icon: '🌙', time: '23:00', color: '#5B6DF0', bgColor: 'rgba(91, 109, 240, 0.2)' },
  { id: '2', type: 'duty', name: '今晚值日', icon: '🧹', time: '22:00-22:30', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)' },
  { id: '3', type: 'lateReturn', name: '晚自习晚归', icon: '📖', time: '22:30', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.2)' },
  { id: '4', type: 'earlyClass', name: '明天早八', icon: '⏰', time: '08:00', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.2)' }
];

const factorTypes = ['phone', 'snack', 'nap', 'coffee', 'stress', 'exercise'];

const PlanPage: React.FC = () => {
  const { scheduleMode, setScheduleMode, generateSleepPlan, courses, updateCourses } = useSleepStore();
  const [activeConstraints, setActiveConstraints] = useState<string[]>(['1', '4']);
  const [factorValues, setFactorValues] = useState<Record<string, number>>({
    phone: 0,
    snack: 0,
    nap: 0,
    coffee: 0,
    stress: 0,
    exercise: 0
  });
  const [plan, setPlan] = useState(genPlan(mockCourses, scheduleMode));

  useEffect(() => {
    updateCourses(mockCourses);
    const newPlan = genPlan(mockCourses, scheduleMode);
    setPlan(newPlan);
  }, [scheduleMode]);

  const handleModeChange = (mode: ScheduleMode) => {
    setScheduleMode(mode);
    Taro.showToast({
      title: `已切换到${getModeLabel(mode)}`,
      icon: 'success'
    });
    console.log('[Plan] Mode changed to', mode);
  };

  const handleConstraintToggle = (id: string) => {
    setActiveConstraints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleFactorChange = (type: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFactorValues(prev => ({ ...prev, [type]: numValue }));
  };

  const handleGeneratePlan = () => {
    generateSleepPlan();
    Taro.showToast({
      title: '计划已更新',
      icon: 'success'
    });
    console.log('[Plan] Sleep plan regenerated');
  };

  const hasEarlyClass = (day: number) => {
    return courses.some(c => c.day === day && c.isEarly);
  };

  const hasClass = (day: number, hour: number) => {
    return courses.some(c => {
      const startHour = parseInt(c.startTime.split(':')[0]);
      const endHour = parseInt(c.endTime.split(':')[0]);
      return c.day === day && hour >= startHour && hour < endHour;
    });
  };

  const weekSleepHours = [7.5, 7, 8, 6.5, 7, 7.5, 8];

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.modeSelector}>
        {modes.map(mode => (
          <View
            key={mode.key}
            className={classnames(styles.modeTab, scheduleMode === mode.key && styles.active)}
            onClick={() => handleModeChange(mode.key)}
          >
            <Text className={styles.modeTabText}>{mode.icon} {mode.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.planOverview}>
        <Text className={styles.planTitle}>🎯 今日睡眠目标</Text>
        <View className={styles.planTimes}>
          <View className={styles.planTimeBlock}>
            <Text className={styles.planTimeLabel}>入睡</Text>
            <Text className={styles.planTimeValue}>{plan.targetBedTime}</Text>
            <Text className={styles.planTimeRange}>{plan.flexibleWindow.minBedTime}-{plan.flexibleWindow.maxBedTime}</Text>
          </View>
          <Text className={styles.planArrow}>→</Text>
          <View className={styles.planTimeBlock}>
            <Text className={styles.planTimeLabel}>起床</Text>
            <Text className={styles.planTimeValue}>{plan.targetWakeTime}</Text>
            <Text className={styles.planTimeRange}>{plan.flexibleWindow.minWakeTime}-{plan.flexibleWindow.maxWakeTime}</Text>
          </View>
        </View>
        <View className={styles.planDuration}>
          <Text className={styles.durationValue}>{plan.targetDuration}h</Text>
          <Text className={styles.durationLabel}>目标睡眠时长</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📚 本周课程表</Text>
          <Button className={styles.editButton} onClick={() => {}}>编辑</Button>
        </View>
        <View className={styles.scheduleGrid}>
          <View className={styles.dayHeader}>
            {dayNames.map((day, index) => (
              <Text key={day} className={classnames(styles.dayCell, hasEarlyClass(index) && styles.hasEarly)}>
                {day}
              </Text>
            ))}
          </View>
          <View className={styles.timeSlots}>
            {[6, 8, 10, 12, 14, 16, 18, 20].map(hour => (
              <View key={hour} className={styles.timeRow}>
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <View
                    key={day}
                    className={classnames(
                      styles.timeCell,
                      hasClass(day, hour) && styles.hasClass,
                      hasClass(day, hour) && hasEarlyClass(day) && hour < 9 && styles.isEarly
                    )}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>⚙️ 约束条件</Text>
        </View>
        <View className={styles.constraintsList}>
          {constraintsData.map(constraint => (
            <View key={constraint.id} className={styles.constraintItem}>
              <View
                className={styles.constraintIcon}
                style={{ backgroundColor: constraint.bgColor }}
              >
                <Text>{constraint.icon}</Text>
              </View>
              <View className={styles.constraintContent}>
                <Text className={styles.constraintName}>{constraint.name}</Text>
                <Text className={styles.constraintTime}>{constraint.time}</Text>
              </View>
              <View
                className={classnames(styles.constraintToggle, activeConstraints.includes(constraint.id) && styles.active)}
                onClick={() => handleConstraintToggle(constraint.id)}
              >
                <View className={styles.constraintToggleDot} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.factorsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📝 影响因素记录</Text>
        </View>
        <View className={styles.factorsGrid}>
          {factorTypes.map(type => {
            const factor = getFactorLabel(type);
            return (
              <View
                key={type}
                className={classnames(styles.factorCard, factorValues[type] > 0 && styles.active)}
              >
                <View className={styles.factorHeader}>
                  <Text className={styles.factorIcon}>{factor.icon}</Text>
                  <Text className={styles.factorName}>{factor.label}</Text>
                </View>
                <View className={styles.factorInput}>
                  <Input
                    className={styles.factorValue}
                    type="number"
                    value={factorValues[type].toString()}
                    onInput={(e) => handleFactorChange(type, e.detail.value)}
                    placeholder="0"
                  />
                  <Text className={styles.factorUnit}>
                    {type === 'stress' ? '级' : type === 'snack' || type === 'coffee' ? '次' : '分钟'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.weekPreview}>
        <Text className={styles.weekTitle}>📊 本周睡眠预览</Text>
        <View className={styles.weekDays}>
          {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
            <View key={day} className={styles.weekDay}>
              <Text className={styles.weekDayName}>{day}</Text>
              <View className={styles.weekDayBar}>
                <View
                  className={styles.weekDayFill}
                  style={{ height: `${(weekSleepHours[index] / 9) * 100}%` }}
                />
              </View>
              <Text className={styles.weekDayValue}>{weekSleepHours[index]}h</Text>
            </View>
          ))}
        </View>
      </View>

      <Button className={styles.generateButton} onClick={handleGeneratePlan}>
        🔄 重新生成睡眠计划
      </Button>
    </ScrollView>
  );
};

export default PlanPage;
