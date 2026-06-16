import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface HabitTagProps {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const HabitTag: React.FC<HabitTagProps> = ({
  icon,
  label,
  value,
  color = '#5B6DF0',
  active = false,
  onClick,
  className
}) => {
  return (
    <View
      className={classnames(styles.tag, active && styles.active, className)}
      style={{
        backgroundColor: active ? `${color}20` : 'rgba(255, 255, 255, 0.05)',
        borderColor: active ? color : '#334155'
      }}
      onClick={onClick}
    >
      <Text className={styles.icon}>{icon}</Text>
      <View className={styles.content}>
        <Text className={styles.label} style={{ color: active ? color : '#94A3B8' }}>{label}</Text>
        {value && <Text className={styles.value}>{value}</Text>}
      </View>
    </View>
  );
};

export default HabitTag;
