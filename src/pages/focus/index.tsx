import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, ScrollView, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import { mockRelaxExercises } from '@/data/mockData';


const noiseOptions = [
  { id: 'rain', name: '雨声', icon: '🌧️' },
  { id: 'forest', name: '森林', icon: '🌲' },
  { id: 'ocean', name: '海浪', icon: '🌊' },
  { id: 'fire', name: '篝火', icon: '🔥' },
  { id: 'wind', name: '微风', icon: '💨' },
  { id: 'night', name: '夏夜', icon: '🦗' }
];

const presetTimes = [5, 10, 15, 25];

const FocusPage: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [thoughtText, setThoughtText] = useState('');
  const [thoughts, setThoughts] = useState<{ id: string; text: string; cleared: boolean }[]>([]);
  const [activeNoise, setActiveNoise] = useState<string | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            Taro.showToast({
              title: '训练完成！',
              icon: 'success'
            });
            console.log('[Focus] Timer completed');
            return selectedTime * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused, selectedTime]);

  useEffect(() => {
    breathingRef.current = setInterval(() => {
      setBreathingPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
    }, 4000);

    return () => {
      if (breathingRef.current) {
        clearInterval(breathingRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    console.log('[Focus] Timer started');
  };

  const handlePause = () => {
    setIsPaused(true);
    console.log('[Focus] Timer paused');
  };

  const handleResume = () => {
    setIsPaused(false);
    console.log('[Focus] Timer resumed');
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(selectedTime * 60);
    console.log('[Focus] Timer reset');
  };

  const handleTimeSelect = (time: number) => {
    if (!isRunning) {
      setSelectedTime(time);
      setTimeLeft(time * 60);
    }
  };

  const handleExerciseToggle = (id: string) => {
    setExpandedExercise(prev => prev === id ? null : id);
  };

  const handleAddThought = () => {
    if (!thoughtText.trim()) {
      Taro.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    const newThought = {
      id: Math.random().toString(36).substring(2, 9),
      text: thoughtText,
      cleared: false
    };
    setThoughts(prev => [...prev, newThought]);
    setThoughtText('');
    console.log('[Focus] Thought added');
  };

  const handleClearThought = (id: string) => {
    setThoughts(prev =>
      prev.map(t => (t.id === id ? { ...t, cleared: !t.cleared } : t))
    );
    console.log('[Focus] Thought toggled');
  };

  const handleClearAll = () => {
    setThoughts([]);
    Taro.showToast({
      title: '已清空所有念头',
      icon: 'success'
    });
    console.log('[Focus] All thoughts cleared');
  };

  const handleNoiseToggle = (id: string) => {
    setActiveNoise(prev => prev === id ? null : id);
    Taro.showToast({
      title: activeNoise === id ? '已关闭' : '已播放',
      icon: 'none'
    });
    console.log('[Focus] Noise toggled:', id);
  };

  const getExerciseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breathing: '呼吸法',
      meditation: '冥想',
      muscle: '肌肉放松',
      thought: '思维清理'
    };
    return labels[type] || type;
  };

  const getExerciseIcon = (type: string) => {
    const icons: Record<string, string> = {
      breathing: '🌬️',
      meditation: '🧘',
      muscle: '💪',
      thought: '🧠'
    };
    return icons[type] || '✨';
  };

  const getExerciseColor = (type: string) => {
    const colors: Record<string, string> = {
      breathing: 'rgba(96, 165, 250, 0.2)',
      meditation: 'rgba(167, 139, 250, 0.2)',
      muscle: 'rgba(34, 197, 94, 0.2)',
      thought: 'rgba(236, 72, 153, 0.2)'
    };
    return colors[type] || 'rgba(91, 109, 240, 0.2)';
  };

  const progress = ((selectedTime * 60 - timeLeft) / (selectedTime * 60)) * 360;

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.headerTitle}>🧘 专注训练</Text>
        <Text className={styles.headerDesc}>
          通过放松练习和思维清理，帮助你平复心情，更快进入睡眠状态
        </Text>
      </View>

      <View className={styles.breathingGuide}>
        <View className={styles.breathingCircle}>
          <Text className={styles.breathingText}>
            {breathingPhase === 'inhale' ? '吸气' : '呼气'}
          </Text>
        </View>
        <Text className={styles.breathingInstruction}>
          跟随圆圈的节奏，深呼吸，放松身心
        </Text>
      </View>

      <View className={styles.timerSection}>
        <Text className={styles.sectionTitle}>⏱️ 专注计时</Text>
        <View className={styles.timerCard}>
          <View className={styles.timerDisplay}>
            <View
              className={styles.timerCircle}
              style={{ background: `conic-gradient(#5B6DF0 ${progress}deg, #334155 ${progress}deg)` }}
            >
              <View className={styles.timerInner}>
                <Text className={styles.timerTime}>{formatTime(timeLeft)}</Text>
                <Text className={styles.timerLabel}>
                  {isRunning ? (isPaused ? '已暂停' : '专注中') : '准备开始'}
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.timerControls}>
            {!isRunning ? (
              <Button className={classnames(styles.timerButton, styles.primary)} onClick={handleStart}>
                ▶️
              </Button>
            ) : (
              <>
                <Button
                  className={classnames(styles.timerButton, styles.secondary)}
                  onClick={handleReset}
                >
                  ⏹️
                </Button>
                <Button
                  className={classnames(styles.timerButton, styles.primary)}
                  onClick={isPaused ? handleResume : handlePause}
                >
                  {isPaused ? '▶️' : '⏸️'}
                </Button>
              </>
            )}
          </View>

          <View className={styles.presetTimes}>
            {presetTimes.map(time => (
              <Button
                key={time}
                className={classnames(styles.presetButton, selectedTime === time && styles.active)}
                onClick={() => handleTimeSelect(time)}
              >
                {time}分钟
              </Button>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.exercisesSection}>
        <Text className={styles.sectionTitle}>✨ 放松练习</Text>
        <View className={styles.exercisesList}>
          {mockRelaxExercises.map(exercise => (
            <View key={exercise.id} className={styles.exerciseCard}>
              <View
                className={styles.exerciseHeader}
                onClick={() => handleExerciseToggle(exercise.id)}
              >
                <View
                  className={styles.exerciseIcon}
                  style={{ backgroundColor: getExerciseColor(exercise.type) }}
                >
                  <Text>{getExerciseIcon(exercise.type)}</Text>
                </View>
                <View className={styles.exerciseInfo}>
                  <Text className={styles.exerciseName}>{exercise.name}</Text>
                  <View className={styles.exerciseMeta}>
                    <Text className={styles.exerciseDuration}>⏱️ {exercise.duration}分钟</Text>
                    <Text className={styles.exerciseType}>{getExerciseTypeLabel(exercise.type)}</Text>
                  </View>
                </View>
              </View>

              {expandedExercise === exercise.id && (
                <>
                  <Text className={styles.exerciseDesc}>{exercise.description}</Text>
                  <View className={styles.exerciseSteps}>
                    {exercise.steps.map((step, index) => (
                      <View key={index} className={styles.stepItem}>
                        <View className={styles.stepNumber}>
                          <Text>{index + 1}</Text>
                        </View>
                        <Text className={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.thoughtClearSection}>
        <Text className={styles.sectionTitle}>📝 脑内清单清空</Text>
        <View className={styles.thoughtClearCard}>
          <Text className={styles.thoughtClearTitle}>
            🧠 把担心的事情写下来
          </Text>
          <Text className={styles.thoughtClearDesc}>
            睡前把脑海中杂念全部"倒"出来，告诉自己"明天再处理"，让大脑得到真正的休息
          </Text>

          <Textarea
            className={styles.thoughtInput}
            value={thoughtText}
            onInput={(e) => setThoughtText(e.detail.value)}
            placeholder="写下你担心的事情、明天的待办、烦恼..."
            maxlength={200}
          />

          <View className={styles.thoughtActions}>
            <Button className={classnames(styles.actionButton, styles.secondary)} onClick={handleClearAll}>
              清空全部
            </Button>
            <Button className={classnames(styles.actionButton, styles.primary)} onClick={handleAddThought}>
              添加到清单
            </Button>
          </View>

          {thoughts.length > 0 && (
            <View className={styles.thoughtList}>
              {thoughts.map(thought => (
                <View key={thought.id} className={styles.thoughtItem}>
                  <View
                    className={classnames(styles.thoughtCheckbox, thought.cleared && styles.checked)}
                    onClick={() => handleClearThought(thought.id)}
                  >
                    {thought.cleared && <Text className={styles.thoughtCheckboxIcon}>✓</Text>}
                  </View>
                  <Text className={classnames(styles.thoughtText, thought.cleared && styles.cleared)}>
                    {thought.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.noiseSection}>
        <Text className={styles.sectionTitle}>🎵 白噪音</Text>
        <View className={styles.noiseGrid}>
          {noiseOptions.map(noise => (
            <View
              key={noise.id}
              className={classnames(styles.noiseCard, activeNoise === noise.id && styles.active)}
              onClick={() => handleNoiseToggle(noise.id)}
            >
              <Text className={styles.noiseIcon}>{noise.icon}</Text>
              <Text className={styles.noiseName}>{noise.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default FocusPage;
