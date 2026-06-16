import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  className,
  color = '#5B6DF0'
}) => {
  return (
    <View className={classnames(styles.card, className)}>
      <View className={styles.icon} style={{ backgroundColor: `${color}20`, color }}>
        <Text>{icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.label}>{label}</Text>
        <View className={styles.valueRow}>
          <Text className={styles.value} style={{ color }}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        {trend && trendValue && (
          <View className={classnames(styles.trend, styles[trend])}>
            <Text>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'} {trendValue}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default StatCard;
