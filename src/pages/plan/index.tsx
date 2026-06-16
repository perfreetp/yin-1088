import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { useSleepStore } from '@/store/sleepStore';
import { mockCourses } from '@/data/mockData';
import { getModeLabel, getFactorLabel } from '@/utils/sleepAlgorithm';
import { ScheduleMode, Course, SleepFactor } from '@/types';

const modes: { key: ScheduleMode; label: string; icon: string }[] = [
  { key: 'normal', label: '常规', icon: '📅' },
  { key: 'exam', label: '考试周', icon: '📚' },
  { key: 'vacation', label: '假期', icon: '🌴' },
];

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const factorTypes = ['phone', 'snack', 'nap', 'coffee', 'stress', 'exercise'];

const emptyCourse: Omit<Course, 'id'> = {
  name: '',
  day: 1,
  startTime: '08:00',
  endTime: '09:40',
  location: '',
  isEarly: true,
};

const PlanPage: React.FC = () => {
  const {
    scheduleMode, setScheduleMode, generateSleepPlan,
    courses, updateCourses, addCourse, updateCourse, deleteCourse,
    constraints, toggleConstraint,
    sleepPlan, todayRecord, updateTodayFactors,
  } = useSleepStore();

  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Omit<Course, 'id'> & { id?: string }>(emptyCourse);
  const [isEditing, setIsEditing] = useState(false);
  const [showCourseList, setShowCourseList] = useState(false);

  const [factorValues, setFactorValues] = useState<Record<string, number>>({
    phone: 0, snack: 0, nap: 0, coffee: 0, stress: 0, exercise: 0,
  });

  useEffect(() => {
    if (courses.length === 0) {
      updateCourses(mockCourses);
    }
    if (!sleepPlan) {
      generateSleepPlan();
    }
  }, []);

  useEffect(() => {
    if (todayRecord?.factors) {
      const vals: Record<string, number> = { phone: 0, snack: 0, nap: 0, coffee: 0, stress: 0, exercise: 0 };
      todayRecord.factors.forEach(f => {
        if (f.type in vals) vals[f.type] = f.value;
      });
      setFactorValues(vals);
    }
  }, [todayRecord?.factors?.length]);

  const plan = useMemo(() => sleepPlan, [sleepPlan]);

  const handleModeChange = (mode: ScheduleMode) => {
    setScheduleMode(mode);
    Taro.showToast({ title: `已切换到${getModeLabel(mode)}`, icon: 'success' });
  };

  const handleConstraintToggle = (id: string) => {
    toggleConstraint(id);
  };

  const handleFactorChange = (type: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFactorValues(prev => ({ ...prev, [type]: numValue }));
  };

  const handleSaveFactors = () => {
    const factors: SleepFactor[] = [];
    factorTypes.forEach(type => {
      const val = factorValues[type];
      if (val > 0) {
        const info = getFactorLabel(type);
        factors.push({
          id: Math.random().toString(36).substring(2, 9),
          name: info.label,
          type: type as SleepFactor['type'],
          value: val,
          unit: type === 'stress' ? '级' : (type === 'snack' || type === 'coffee') ? '次' : '分钟',
        });
      }
    });
    updateTodayFactors(factors);
    Taro.showToast({ title: '因素已保存', icon: 'success' });
  };

  const handleGeneratePlan = () => {
    generateSleepPlan();
    Taro.showToast({ title: '计划已更新', icon: 'success' });
  };

  const handleOpenAddCourse = () => {
    setEditingCourse({ ...emptyCourse });
    setIsEditing(false);
    setShowCourseEditor(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse({ ...course });
    setIsEditing(true);
    setShowCourseEditor(true);
    setShowCourseList(false);
  };

  const handleSaveCourse = () => {
    const c = editingCourse;
    if (!c.name.trim()) {
      Taro.showToast({ title: '请输入课程名', icon: 'none' });
      return;
    }
    const isEarly = parseInt(c.startTime.split(':')[0]) < 9;
    const courseData = { ...c, isEarly };

    if (isEditing && c.id) {
      updateCourse(c.id, courseData);
      Taro.showToast({ title: '课程已更新', icon: 'success' });
    } else {
      addCourse({
        id: Math.random().toString(36).substring(2, 9),
        ...courseData,
      } as Course);
      Taro.showToast({ title: '课程已添加', icon: 'success' });
    }
    setShowCourseEditor(false);
  };

  const handleDeleteCourse = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这门课程吗？',
      success: (res) => {
        if (res.confirm) {
          deleteCourse(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setShowCourseList(false);
        }
      },
    });
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

  const getCourseAtSlot = (day: number, hour: number): Course | undefined => {
    return courses.find(c => {
      const startHour = parseInt(c.startTime.split(':')[0]);
      return c.day === day && startHour === hour;
    });
  };

  const weekSleepHours = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 0].map(() => {
      if (plan) {
        const duration = plan.targetDuration;
        return duration;
      }
      return 7.5;
    });
  }, [plan]);

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

      {plan && (
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
          {plan.constraints.length > 0 && (
            <View className={styles.constraintHints}>
              {plan.constraints.map(c => (
                <Text key={c.id} className={styles.constraintHint}>
                  🔒 {c.name}已纳入计划
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📚 本周课程表</Text>
          <View className={styles.headerButtons}>
            <Button className={styles.editButton} onClick={() => setShowCourseList(!showCourseList)}>
              {showCourseList ? '收起' : '管理'}
            </Button>
            <Button className={styles.editButton} onClick={handleOpenAddCourse}>+ 新增</Button>
          </View>
        </View>

        {showCourseList && courses.length > 0 && (
          <View className={styles.courseList}>
            {courses.map(course => (
              <View key={course.id} className={styles.courseListItem}>
                <View className={styles.courseListInfo}>
                  <Text className={styles.courseListName}>
                    {course.isEarly && <Text className={styles.earlyBadge}>早八</Text>}
                    {course.name}
                  </Text>
                  <Text className={styles.courseListDetail}>
                    {dayNames[course.day]} {course.startTime}-{course.endTime} {course.location}
                  </Text>
                </View>
                <View className={styles.courseListActions}>
                  <Text className={styles.courseEditBtn} onClick={() => handleOpenEditCourse(course)}>编辑</Text>
                  <Text className={styles.courseDeleteBtn} onClick={() => handleDeleteCourse(course.id)}>删除</Text>
                </View>
              </View>
            ))}
          </View>
        )}

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
                {[0, 1, 2, 3, 4, 5, 6].map(day => {
                  const courseAtSlot = getCourseAtSlot(day, hour);
                  return (
                    <View
                      key={day}
                      className={classnames(
                        styles.timeCell,
                        hasClass(day, hour) && styles.hasClass,
                        hasClass(day, hour) && hasEarlyClass(day) && hour < 9 && styles.isEarly,
                      )}
                    >
                      {courseAtSlot && (
                        <Text className={styles.cellCourseName}>{courseAtSlot.name.slice(0, 2)}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {showCourseEditor && (
        <View className={styles.modalOverlay} onClick={() => setShowCourseEditor(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>{isEditing ? '编辑课程' : '新增课程'}</Text>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>课程名称</Text>
              <Input
                className={styles.formInput}
                value={editingCourse.name}
                onInput={(e) => setEditingCourse(prev => ({ ...prev, name: e.detail.value }))}
                placeholder="如：高等数学"
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>星期</Text>
              <View className={styles.dayPicker}>
                {[1, 2, 3, 4, 5, 6, 0].map(d => (
                  <View
                    key={d}
                    className={classnames(styles.dayPickerItem, editingCourse.day === d && styles.dayPickerActive)}
                    onClick={() => setEditingCourse(prev => ({ ...prev, day: d }))}
                  >
                    <Text className={styles.dayPickerText}>{dayNames[d]}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.formRow}>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>开始时间</Text>
                <Input
                  className={styles.formInput}
                  value={editingCourse.startTime}
                  onInput={(e) => setEditingCourse(prev => ({ ...prev, startTime: e.detail.value }))}
                  placeholder="08:00"
                />
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>结束时间</Text>
                <Input
                  className={styles.formInput}
                  value={editingCourse.endTime}
                  onInput={(e) => setEditingCourse(prev => ({ ...prev, endTime: e.detail.value }))}
                  placeholder="09:40"
                />
              </View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>教室</Text>
              <Input
                className={styles.formInput}
                value={editingCourse.location}
                onInput={(e) => setEditingCourse(prev => ({ ...prev, location: e.detail.value }))}
                placeholder="如：教学楼A101"
              />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>早八标记（9点前自动标记）</Text>
              <Text className={styles.earlyPreview}>
                {parseInt(editingCourse.startTime.split(':')[0]) < 9 ? '✅ 是早八课程' : '❌ 非早八课程'}
              </Text>
            </View>
            <View className={styles.modalButtons}>
              <Button className={styles.modalCancel} onClick={() => setShowCourseEditor(false)}>取消</Button>
              <Button className={styles.modalConfirm} onClick={handleSaveCourse}>保存</Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>⚙️ 约束条件</Text>
        </View>
        <View className={styles.constraintsList}>
          {constraints.map(constraint => (
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
                className={classnames(styles.constraintToggle, constraint.enabled && styles.active)}
                onClick={() => handleConstraintToggle(constraint.id)}
              >
                <View className={styles.constraintToggleDot} />
              </View>
            </View>
          ))}
        </View>
        {constraints.some(c => c.enabled) && (
          <View className={styles.constraintEffectHint}>
            <Text className={styles.effectHintText}>
              💡 已启用约束会自动调整睡眠窗口，点击"重新生成"查看效果
            </Text>
          </View>
        )}
      </View>

      <View className={styles.factorsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>📝 影响因素记录</Text>
          <Button className={styles.editButton} onClick={handleSaveFactors}>保存</Button>
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
