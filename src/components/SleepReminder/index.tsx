import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import dayjs from 'dayjs';
import { useSleepStore } from '@/store/sleepStore';

const SleepReminder: React.FC = () => {
  const { reminder, dismissReminder } = useSleepStore();
  const [showAlert, setShowAlert] = useState(false);

  const checkReminderTrigger = () => {
    if (!reminder.enabled || !reminder.reminderTime) return;
    const now = dayjs();
    const reminderDate = now.format('YYYY-MM-DD');
    if (reminder.lastTriggeredDate === reminderDate) return;

    const nowMinutes = now.hour() * 60 + now.minute();
    const [rh, rm] = reminder.reminderTime.split(':').map(Number);
    const reminderMinutes = rh * 60 + rm;
    if (nowMinutes >= reminderMinutes && nowMinutes < reminderMinutes + 60) {
      setShowAlert(true);
    }
  };

  useEffect(() => {
    checkReminderTrigger();
    const timer = setInterval(() => {
      checkReminderTrigger();
    }, 30000);
    return () => clearInterval(timer);
  }, [reminder.enabled, reminder.reminderTime, reminder.lastTriggeredDate]);

  useDidShow(() => {
    checkReminderTrigger();
  });

  const handleDismiss = () => {
    dismissReminder();
    setShowAlert(false);
  };

  if (!showAlert) return null;

  return (
    <View className={styles.reminderAlertOverlay}>
      <View className={styles.reminderAlert}>
        <Text className={styles.reminderAlertIcon}>🔕</Text>
        <Text className={styles.reminderAlertTitle}>降噪提醒</Text>
        <Text className={styles.reminderAlertText}>
          距离目标入睡时间还有 {reminder.minutesBefore} 分钟{'\n'}
          请开始准备入睡，减少噪音和光线刺激
        </Text>
        <Button className={styles.reminderAlertBtn} onClick={handleDismiss}>
          知道了，准备入睡
        </Button>
      </View>
    </View>
  );
};

export default SleepReminder;
