import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import dayjs from 'dayjs';

import { useSleepStore } from '@/store/sleepStore';
import { mockDormMates, mockDormReminders } from '@/data/mockData';
import { DormReminder } from '@/types';
import SleepReminder from '@/components/SleepReminder';

const quickReminders = [
  { type: 'headphone', icon: '🎧', name: '请戴耳机', desc: '我要准备休息了', color: '#5B6DF0', bgColor: 'rgba(91, 109, 240, 0.2)' },
  { type: 'light', icon: '💡', name: '请调暗灯光', desc: '光线有点亮', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)' },
  { type: 'door', icon: '🚪', name: '轻声关门', desc: '已经入睡了', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.2)' },
  { type: 'quiet', icon: '🤫', name: '保持安静', desc: '在学习/休息', color: '#EC4899', bgColor: 'rgba(236, 72, 153, 0.2)' }
];

const agreements = [
  { id: '1', text: '23:00后自觉佩戴耳机', subtext: '如需看视频或听音乐', checked: true },
  { id: '2', text: '23:00后调暗灯光', subtext: '可使用台灯或小夜灯', checked: true },
  { id: '3', text: '23:30后轻声进出', subtext: '开关门尽量放轻', checked: false },
  { id: '4', text: '值日当天及时打扫', subtext: '保持宿舍整洁', checked: true }
];

const DormPage: React.FC = () => {
  const { addDormReminder } = useSleepStore();
  const [customMessage, setCustomMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [checkedAgreements, setCheckedAgreements] = useState<string[]>(['1', '2', '4']);
  const [reminders, setReminders] = useState<DormReminder[]>(mockDormReminders);

  const handleQuickReminder = (reminder: typeof quickReminders[0]) => {
    const newReminder: DormReminder = {
      id: Math.random().toString(36).substring(2, 9),
      type: reminder.type as any,
      message: reminder.desc,
      senderId: 'me',
      senderName: isAnonymous ? '匿名室友' : '我',
      timestamp: new Date().toISOString(),
      isAnonymous
    };
    setReminders([newReminder, ...reminders]);
    addDormReminder(newReminder);
    Taro.showToast({
      title: '提示已发送',
      icon: 'success'
    });
    console.log('[Dorm] Quick reminder sent:', reminder.type);
  };

  const handleSendCustom = () => {
    if (!customMessage.trim()) {
      Taro.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    const newReminder: DormReminder = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'quiet',
      message: customMessage,
      senderId: 'me',
      senderName: isAnonymous ? '匿名室友' : '我',
      timestamp: new Date().toISOString(),
      isAnonymous
    };
    setReminders([newReminder, ...reminders]);
    addDormReminder(newReminder);
    setCustomMessage('');
    Taro.showToast({
      title: '提示已发送',
      icon: 'success'
    });
    console.log('[Dorm] Custom reminder sent');
  };

  const handleAgreementToggle = (id: string) => {
    setCheckedAgreements(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleReminderAction = (_id: string, action: string) => {
    Taro.showToast({
      title: action === 'accept' ? '已确认' : '已忽略',
      icon: 'success'
    });
    console.log('[Dorm] Reminder action:', action);
  };

  const formatTime = (timestamp: string) => {
    return dayjs(timestamp).format('HH:mm');
  };

  const getReminderIcon = (type: string) => {
    const icons: Record<string, string> = {
      headphone: '🎧',
      light: '💡',
      door: '🚪',
      quiet: '🤫'
    };
    return icons[type] || '📢';
  };

  return (
    <>
    <ScrollView className={styles.container} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>🏠 宿舍协同</Text>
        <Text className={styles.headerDesc}>
          温和地沟通作息差异，互相尊重，共同营造良好的睡眠环境
        </Text>
      </View>

      <View className={styles.quietTimeCard}>
        <View className={styles.quietTimeHeader}>
          <Text className={styles.quietTimeTitle}>⏰ 宿舍安静时间</Text>
          <View className={styles.quietTimeBadge}>
            <Text className={styles.quietTimeBadgeText}>已生效</Text>
          </View>
        </View>
        <View className={styles.quietTimeDisplay}>
          <View className={styles.quietTimeItem}>
            <Text className={styles.quietTimeLabel}>开始</Text>
            <Text className={styles.quietTimeValue}>22:30</Text>
          </View>
          <Text className={styles.quietTimeDivider}>—</Text>
          <View className={styles.quietTimeItem}>
            <Text className={styles.quietTimeLabel}>结束</Text>
            <Text className={styles.quietTimeValue}>07:00</Text>
          </View>
        </View>
      </View>

      <View className={styles.reminderSection}>
        <Text className={styles.sectionTitle}>⚡ 快捷提示</Text>
        <View className={styles.quickReminders}>
          {quickReminders.map(reminder => (
            <View
              key={reminder.type}
              className={styles.reminderCard}
              onClick={() => handleQuickReminder(reminder)}
            >
              <View
                className={styles.reminderIcon}
                style={{ backgroundColor: reminder.bgColor }}
              >
                <Text>{reminder.icon}</Text>
              </View>
              <Text className={styles.reminderName}>{reminder.name}</Text>
              <Text className={styles.reminderDesc}>{reminder.desc}</Text>
            </View>
          ))}
        </View>

        <Text className={styles.sectionTitle}>📬 收到的提示</Text>
        <View className={styles.remindersList}>
          {reminders.map(reminder => (
            <View key={reminder.id} className={styles.reminderItem}>
              <View className={styles.reminderItemHeader}>
                <Text className={styles.reminderItemIcon}>{getReminderIcon(reminder.type)}</Text>
                <Text className={styles.reminderItemSender}>
                  {reminder.isAnonymous ? '匿名室友' : reminder.senderName}
                </Text>
              </View>
              <Text className={styles.reminderItemContent}>{reminder.message}</Text>
              <View className={styles.reminderItemFooter}>
                <Text className={styles.reminderItemTime}>{formatTime(reminder.timestamp)}</Text>
                <View className={styles.reminderItemActions}>
                  <Button
                    className={classnames(styles.actionButton, styles.secondary)}
                    onClick={() => handleReminderAction(reminder.id, 'ignore')}
                  >
                    忽略
                  </Button>
                  <Button
                    className={styles.actionButton}
                    onClick={() => handleReminderAction(reminder.id, 'accept')}
                  >
                    好的
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.roommatesSection}>
        <Text className={styles.sectionTitle}>👥 室友作息</Text>
        <View className={styles.roommatesList}>
          {mockDormMates.map(mate => (
            <View key={mate.id} className={styles.roommateItem}>
              <View className={styles.roommateAvatar}>
                <Text className={styles.roommateAvatarText}>{mate.name[0]}</Text>
              </View>
              <View className={styles.roommateInfo}>
                <Text className={styles.roommateName}>{mate.name}</Text>
                <Text className={styles.roommateSchedule}>
                  🌙 {mate.sleepSchedule.bedTime} - ☀️ {mate.sleepSchedule.wakeTime}
                </Text>
                <View className={styles.roommatePrefs}>
                  <Text className={styles.prefTag}>
                    🎧 {mate.preferences.acceptHeadphone ? '接受耳机' : '需要安静'}
                  </Text>
                  <Text className={styles.prefTag}>
                    💡 {mate.preferences.acceptLight === 'off' ? '需关灯' : mate.preferences.acceptLight === 'dim' ? '可暗光' : '正常光'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.agreementSection}>
        <Text className={styles.sectionTitle}>📜 宿舍作息公约</Text>
        <View className={styles.agreementCard}>
          <Text className={styles.agreementTitle}>我们约定</Text>
          <View className={styles.agreementList}>
            {agreements.map(agreement => (
              <View key={agreement.id} className={styles.agreementItem}>
                <View
                  className={classnames(styles.agreementCheck, checkedAgreements.includes(agreement.id) && styles.checked)}
                  onClick={() => handleAgreementToggle(agreement.id)}
                >
                  {checkedAgreements.includes(agreement.id) && (
                    <Text className={styles.agreementCheckIcon}>✓</Text>
                  )}
                </View>
                <View className={styles.agreementContent}>
                  <Text className={styles.agreementText}>{agreement.text}</Text>
                  <Text className={styles.agreementSubtext}>{agreement.subtext}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.customReminder}>
        <Text className={styles.customReminderTitle}>✍️ 自定义提示</Text>
        <Textarea
          className={styles.customReminderInput}
          value={customMessage}
          onInput={(e) => setCustomMessage(e.detail.value)}
          placeholder="温和地表达你的需求..."
          maxlength={100}
        />
        <View className={styles.anonymousRow}>
          <Text className={styles.anonymousLabel}>匿名发送</Text>
          <View
            className={classnames(styles.anonymousToggle, isAnonymous && styles.active)}
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <View className={styles.anonymousToggleDot} />
          </View>
        </View>
        <Button className={styles.sendButton} onClick={handleSendCustom}>
          发送提示
        </Button>
      </View>
    </ScrollView>
    <SleepReminder />
    </>
  );
};

export default DormPage;
