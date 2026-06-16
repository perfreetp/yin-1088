import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import dayjs from 'dayjs';

import ProgressRing from '@/components/ProgressRing';

import { useSleepStore } from '@/store/sleepStore';
import { mockEncouragements } from '@/data/mockData';
import { Encouragement } from '@/types';

const chartTabs = [
  { key: 'duration', label: '睡眠时长' },
  { key: 'quality', label: '睡眠质量' },
  { key: 'execution', label: '执行率' },
];

const healthTips = [
  { id: '1', icon: '📱', title: '减少睡前刷手机', desc: '建议睡前30分钟放下手机，蓝光会抑制褪黑素分泌，影响入睡' },
  { id: '2', icon: '☕', title: '下午少喝咖啡', desc: '咖啡因的半衰期约6小时，下午3点后尽量避免摄入' },
  { id: '3', icon: '🏃', title: '保持规律运动', desc: '每天30分钟有氧运动可显著改善睡眠质量，但避免睡前3小时剧烈运动' },
  { id: '4', icon: '🌡️', title: '控制卧室温度', desc: '最适宜睡眠的室温是18-22°C，稍低的体温有助于入睡' },
];

const ReportPage: React.FC = () => {
  const { getWeeklyStats, historyRecords, sleepPlan } = useSleepStore();
  const [activeChart, setActiveChart] = useState('duration');
  const [encouragements, setEncouragements] = useState<Encouragement[]>(mockEncouragements);
  const [newEncouragement, setNewEncouragement] = useState('');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const stats = useMemo(() => getWeeklyStats(), [historyRecords, sleepPlan]);

  const summary = useMemo(() => {
    const avgSleep = stats.avgSleepDuration;
    const regularity = stats.executionRate;
    let healthStatus: 'good' | 'normal' | 'warning' = 'normal';
    let suggestion = '';

    if (avgSleep >= 7 && regularity >= 80) {
      healthStatus = 'good';
      suggestion = '睡眠状况良好，请继续保持规律作息。';
    } else if (avgSleep >= 6 && regularity >= 60) {
      healthStatus = 'normal';
      suggestion = '整体睡眠状况一般，建议保持规律作息，减少睡前使用手机的时间。';
    } else {
      healthStatus = 'warning';
      suggestion = '睡眠状况需要关注，建议调整作息时间，必要时咨询专业医生。';
    }

    return { period: '近7天', avgSleep, regularity, healthStatus, suggestion };
  }, [stats]);

  const weekStart = dayjs(stats.weekStart).format('MM月DD日');
  const weekEnd = dayjs(stats.weekEnd).format('MM月DD日');

  const handleChartChange = (key: string) => {
    setActiveChart(key);
  };

  const handleSendEncouragement = () => {
    if (!newEncouragement.trim()) {
      Taro.showToast({ title: '请输入鼓励内容', icon: 'none' });
      return;
    }
    const newItem: Encouragement = {
      id: Math.random().toString(36).substring(2, 9),
      content: newEncouragement,
      timestamp: new Date().toISOString(),
      isAnonymous: true,
    };
    setEncouragements([newItem, ...encouragements]);
    setNewEncouragement('');
    Taro.showToast({ title: '已发送鼓励', icon: 'success' });
  };

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleShareSummary = () => {
    Taro.showActionSheet({
      itemList: ['分享给辅导员', '分享给家长', '生成图片'],
      success: () => {
        Taro.showToast({ title: '已生成摘要', icon: 'success' });
      },
    });
  };

  const getBarHeight = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  const getChartData = () => {
    return stats.dailyRecords.map(record => {
      switch (activeChart) {
        case 'duration': return { primary: record.sleepDuration, max: 10 };
        case 'quality': return { primary: record.quality, max: 100 };
        case 'execution': return { primary: record.executionRate, max: 100 };
        default: return { primary: record.sleepDuration, max: 10 };
      }
    });
  };

  const formatTime = (timestamp: string) => {
    return dayjs(timestamp).format('MM-DD HH:mm');
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, { text: string; class: string }> = {
      good: { text: '状态良好', class: 'good' },
      normal: { text: '状态一般', class: 'normal' },
      warning: { text: '需要关注', class: 'warning' },
    };
    return labels[status] || labels.normal;
  };

  const statusBadge = getStatusBadge(summary.healthStatus);
  const chartData = getChartData();

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>📊 本周睡眠报告</Text>
        <Text className={styles.headerDate}>{weekStart} - {weekEnd}</Text>
      </View>

      <View className={styles.overviewSection}>
        <Text className={styles.sectionTitle}>📈 核心指标</Text>
        <View className={styles.overviewGrid}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewIcon}>✅</Text>
            <Text className={styles.overviewValue}>{stats.executionRate}<Text className={styles.overviewUnit}>%</Text></Text>
            <Text className={styles.overviewLabel}>执行率</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewIcon}>⏰</Text>
            <Text className={styles.overviewValue}>{stats.avgSleepDuration}<Text className={styles.overviewUnit}>h</Text></Text>
            <Text className={styles.overviewLabel}>平均时长</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewIcon}>😴</Text>
            <Text className={styles.overviewValue}>{stats.avgQuality}<Text className={styles.overviewUnit}>分</Text></Text>
            <Text className={styles.overviewLabel}>平均质量</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewIcon}>🎯</Text>
            <Text className={styles.overviewValue}>{stats.focusLevel}<Text className={styles.overviewUnit}>%</Text></Text>
            <Text className={styles.overviewLabel}>专注感</Text>
          </View>
        </View>
      </View>

      <View className={styles.chartSection}>
        <View className={styles.chartCard}>
          <View className={styles.chartHeader}>
            <Text className={styles.chartTitle}>📊 每日数据对照</Text>
            <View className={styles.chartTabs}>
              {chartTabs.map(tab => (
                <Text
                  key={tab.key}
                  className={classnames(styles.chartTab, activeChart === tab.key && styles.active)}
                  onClick={() => handleChartChange(tab.key)}
                >
                  {tab.label}
                </Text>
              ))}
            </View>
          </View>

          <View className={styles.chartContainer}>
            {stats.dailyRecords.map((record, index) => (
              <View key={record.date} className={styles.chartBarGroup}>
                <View className={styles.chartBars}>
                  <View
                    className={classnames(styles.chartBar, 'primary')}
                    style={{ height: getBarHeight(chartData[index].primary, chartData[index].max) }}
                  />
                </View>
                <Text className={styles.chartDayLabel}>{record.date.slice(5)}</Text>
              </View>
            ))}
          </View>

          <View className={styles.chartLegend}>
            <View className={styles.legendItem}>
              <View className={classnames(styles.legendDot, 'primary')} style={{ background: '#5B6DF0' }} />
              <Text className={styles.legendText}>
                {activeChart === 'duration' ? '睡眠时长' : activeChart === 'quality' ? '睡眠质量' : '执行率'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.comparisonSection}>
        <View className={styles.comparisonCard}>
          <View className={styles.comparisonHeader}>
            <Text className={styles.comparisonTitle}>⚖️ 三项对照</Text>
          </View>
          <View className={styles.comparisonGrid}>
            <View className={styles.comparisonItem}>
              <ProgressRing
                progress={stats.executionRate}
                size={100}
                strokeWidth={8}
                color="#22C55E"
                label={`${stats.executionRate}%`}
                subLabel="执行率"
              />
              <Text className={classnames(styles.comparisonTrend, stats.executionRate >= 75 ? 'up' : 'down')}>
                {stats.executionRate >= 75 ? '↑ 优秀' : '↓ 待提升'}
              </Text>
            </View>
            <View className={styles.comparisonItem}>
              <ProgressRing
                progress={100 - stats.sleepinessLevel}
                size={100}
                strokeWidth={8}
                color="#F59E0B"
                label={`${stats.sleepinessLevel}%`}
                subLabel="困倦度"
              />
              <Text className={classnames(styles.comparisonTrend, stats.sleepinessLevel <= 60 ? 'up' : 'down')}>
                {stats.sleepinessLevel <= 60 ? '↑ 精神' : '↓ 较困'}
              </Text>
            </View>
            <View className={styles.comparisonItem}>
              <ProgressRing
                progress={stats.focusLevel}
                size={100}
                strokeWidth={8}
                color="#5B6DF0"
                label={`${stats.focusLevel}%`}
                subLabel="专注感"
              />
              <Text className={classnames(styles.comparisonTrend, stats.focusLevel >= 70 ? 'up' : 'down')}>
                {stats.focusLevel >= 70 ? '↑ 专注' : '↓ 一般'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.encouragementSection}>
        <Text className={styles.sectionTitle}>💪 同学互励</Text>
        <View className={styles.encouragementCard}>
          <Text className={styles.encouragementQuote}>
            "睡眠是最好的复习方式，好好休息，明天的你会感谢今晚早睡的自己。"
          </Text>
          <Text className={styles.encouragementAuthor}>—— 来自匿名同学</Text>
        </View>

        <View className={styles.encouragementList}>
          {encouragements.slice(0, 3).map(item => (
            <View key={item.id} className={styles.encouragementItem}>
              <Text className={styles.encouragementContent}>{item.content}</Text>
              <View className={styles.encouragementFooter}>
                <Text className={styles.encouragementSender}>
                  {item.isAnonymous ? '匿名同学' : item.senderName} · {formatTime(item.timestamp)}
                </Text>
                <View className={styles.encouragementLike} onClick={() => handleLike(item.id)}>
                  <Text>{likedItems.has(item.id) ? '❤️' : '🤍'}</Text>
                  <Text>{likedItems.has(item.id) ? 1 : 0}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.encouragementInput}>
          <Input
            className={styles.encouragementInputField}
            value={newEncouragement}
            onInput={(e) => setNewEncouragement(e.detail.value)}
            placeholder="写一句鼓励的话..."
            maxlength={50}
          />
          <Button className={styles.sendButton} onClick={handleSendEncouragement}>发送</Button>
        </View>
      </View>

      <View className={styles.summarySection}>
        <Text className={styles.sectionTitle}>👨‍👩‍👧 关怀摘要</Text>
        <View className={styles.summaryCard}>
          <View className={styles.summaryHeader}>
            <Text className={styles.summaryTitle}>辅导员/家长版</Text>
            <View className={classnames(styles.summaryBadge, styles[statusBadge.class])}>
              <Text>{statusBadge.text}</Text>
            </View>
          </View>
          <View className={styles.summaryStats}>
            <View className={styles.summaryStat}>
              <Text className={styles.summaryStatLabel}>平均睡眠</Text>
              <Text className={styles.summaryStatValue}>{summary.avgSleep}小时/天</Text>
            </View>
            <View className={styles.summaryStat}>
              <Text className={styles.summaryStatLabel}>作息规律性</Text>
              <Text className={styles.summaryStatValue}>{summary.regularity}%</Text>
            </View>
          </View>
          <Text className={styles.summarySuggestion}>{summary.suggestion}</Text>
          <Button className={styles.shareButton} onClick={handleShareSummary}>📤 生成可分享摘要</Button>
        </View>
      </View>

      <View className={styles.tipsSection}>
        <Text className={styles.sectionTitle}>💡 健康建议</Text>
        <View className={styles.tipsList}>
          {healthTips.map(tip => (
            <View key={tip.id} className={styles.tipCard}>
              <Text className={styles.tipIcon}>{tip.icon}</Text>
              <View className={styles.tipContent}>
                <Text className={styles.tipTitle}>{tip.title}</Text>
                <Text className={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReportPage;
