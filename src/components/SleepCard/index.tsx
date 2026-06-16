import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface SleepCardProps {
  bedTime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  className?: string;
}

const SleepCard: React.FC<SleepCardProps> = ({ bedTime, wakeTime, duration, quality, className }) => {
  const getQualityColor = (q: number) => {
    if (q >= 80) return '#22C55E';
    if (q >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View className={classnames(styles.card, className)}>
      <View className={styles.header}>
        <Text className={styles.title}>🌙 昨晚睡眠</Text>
        <View className={styles.qualityBadge} style={{ backgroundColor: getQualityColor(quality) }}>
          <Text className={styles.qualityText}>{quality}分</Text>
        </View>
      </View>
      
      <View className={styles.timeRow}>
        <View className={styles.timeItem}>
          <Text className={styles.timeLabel}>入睡</Text>
          <Text className={styles.timeValue}>{bedTime}</Text>
        </View>
        <View className={styles.duration}>
          <Text className={styles.durationValue}>{duration}h</Text>
          <Text className={styles.durationLabel}>睡眠时长</Text>
        </View>
        <View className={styles.timeItem}>
          <Text className={styles.timeLabel}>起床</Text>
          <Text className={styles.timeValue}>{wakeTime}</Text>
        </View>
      </View>
    </View>
  );
};

export default SleepCard;
