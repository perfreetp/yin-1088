import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🌙',
  title,
  description,
  actionText,
  onAction,
  className
}) => {
  return (
    <View className={classnames(styles.container, className)}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
      {actionText && onAction && (
        <Button className={styles.button} onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;
