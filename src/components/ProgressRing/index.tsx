import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  subLabel?: string;
  className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 160,
  strokeWidth = 12,
  color = '#5B6DF0',
  bgColor = '#334155',
  showLabel = true,
  label,
  subLabel,
  className
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View className={classnames(styles.container, className)} style={{ width: size, height: size }}>
      <View className={styles.ring}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
      </View>
      {showLabel && (
        <View className={styles.labelContainer}>
          <Text className={styles.label} style={{ color }}>{label || `${Math.round(progress)}%`}</Text>
          {subLabel && <Text className={styles.subLabel}>{subLabel}</Text>}
        </View>
      )}
    </View>
  );
};

export default ProgressRing;
