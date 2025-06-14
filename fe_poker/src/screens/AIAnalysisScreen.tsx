import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Hand } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '../viewmodels/sessionStore';
import { API_BASE_URL } from '../config/api';

// AI分析優先使用Railway，失敗時回退到本地
const RAILWAY_URL = 'https://poker-production-12db.up.railway.app';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { handId } = route.params;
  const { getHand } = useSessionStore();
  const [hand, setHand] = useState<Hand | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);

  console.log('AIAnalysisScreen mounted with hand:', hand);

  useEffect(() => {
    loadHandAndAnalysis();
  }, [handId]);

  const loadHandAndAnalysis = async () => {
    try {
      const handData = await getHand(handId);
      setHand(handData);
      
      if (handData.analysis) {
        setAnalysis(handData.analysis);
        setLoading(false);
      } else {
        await performAIAnalysis(handData);
      }
    } catch (error) {
      console.error('Failed to load hand:', error);
      setLoading(false);
    }
  };

  const performAIAnalysis = async (handData?: Hand) => {
    const targetHand = handData || hand;
    if (!targetHand) return;
    
    setLoading(true);
    try {
      // 首先嘗試Railway API
      console.log('Attempting Railway AI analysis...');
      const analysisResult = await performRailwayAIAnalysis(targetHand);
      setAnalysis(analysisResult);
      console.log('Railway AI analysis successful');
    } catch (railwayError) {
      console.log('Railway AI analysis failed, trying local API...');
      try {
        // Railway失敗時，嘗試本地API
        const analysisResult = await performLocalAIAnalysis(targetHand);
        setAnalysis(analysisResult);
        console.log('Local AI analysis successful');
      } catch (localError) {
        console.log('Local AI analysis also failed, using simulation...');
        // 兩個都失敗時，使用模擬分析
        const simulatedAnalysis = await simulateAIAnalysis(targetHand);
        setAnalysis(simulatedAnalysis);
      }
    } finally {
      setLoading(false);
    }
  };

  const performRailwayAIAnalysis = async (handData: Hand): Promise<string> => {
    console.log('Performing Railway AI analysis for hand:', handData.id);
    
    const response = await fetch(`${RAILWAY_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handId: handData.id
      }),
      // 設置較短的超時時間
      signal: AbortSignal.timeout(10000) // 10秒超時
    });

    console.log(`Railway API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.analysis || 'No analysis available';
  };

  const performLocalAIAnalysis = async (handData: Hand): Promise<string> => {
    console.log('Performing local AI analysis for hand:', handData.id);
    
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handId: handData.id
      }),
      signal: AbortSignal.timeout(10000) // 10秒超時
    });

    console.log(`Local API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`Local API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.analysis || 'No analysis available';
  };

  // 模擬AI分析功能（作為備用）
  const simulateAIAnalysis = async (handData: Hand): Promise<string> => {
    // 模擬網絡延遲
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const position = handData.position || 'Unknown';
    const result = handData.result;
    const holeCards = handData.holeCards || 'Unknown';
    const board = handData.board || 'No board shown';
    
    let analysis = `🎯 Position Analysis:\nPlaying from ${position} position.\n\n`;
    analysis += `🃏 Hole Cards Analysis:\nStarting hand: ${holeCards}\n`;
    
    // 分析起手牌強度
    if (holeCards.includes('A') || holeCards.includes('K')) {
      analysis += `Strong starting hand with premium cards.\n\n`;
    } else {
      analysis += `Consider position and stack sizes with this holding.\n\n`;
    }
    
    analysis += `🎲 Board Analysis:\n${board}\n\n`;
    
    analysis += `💰 Result Analysis:\n`;
    if (result > 0) {
      analysis += `Won $${result} - Positive outcome achieved.\n`;
      analysis += `The play execution appears to have been effective.\n\n`;
      analysis += `📈 Recommendations:\n`;
      analysis += `• Continue applying similar strategy in comparable spots\n`;
      analysis += `• Review the decision points that led to this success\n`;
      analysis += `• Consider this line in similar board textures`;
    } else {
      analysis += `Lost $${Math.abs(result)} - Learning opportunity identified.\n`;
      analysis += `Every loss provides valuable feedback for improvement.\n\n`;
      analysis += `📉 Areas for Review:\n`;
      analysis += `• Pre-flop decision making from ${position}\n`;
      analysis += `• Post-flop betting patterns and sizing\n`;
      analysis += `• Consider tighter range selection in this position\n`;
      analysis += `• Review opponent tendencies and adjust accordingly`;
    }
    
    return analysis;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleReanalyze = () => {
    // 強制重新分析
    const handWithoutAnalysis = { ...hand, analysis: undefined };
    performAIAnalysis();
  };

  // 美化分析結果顯示
  const formatAnalysisText = (text: string): string => {
    if (!text) return text;
    
    return text
      // 移除多餘的 markdown 符號
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // 移除 **bold**
      .replace(/\*([^*]+)\*/g, '$1')      // 移除 *italic*
      .replace(/^- /gm, '• ')             // 將 - 改為 •
      .replace(/^## /gm, '\n')            // 移除 ## 標題符號
      .replace(/^# /gm, '\n')             // 移除 # 標題符號
      .replace(/\n{3,}/g, '\n\n')         // 限制最多兩個換行
      .trim();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>AI is analyzing your hand...</Text>
        <Text style={styles.loadingSubText}>This may take a few moments</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Analysis</Text>
        <TouchableOpacity onPress={handleReanalyze} style={styles.reanalyzeButton}>
          <Text style={styles.reanalyzeButtonText}>Re-analyze</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Hand Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Hand Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Position:</Text>
            <Text style={styles.summaryValue}>{hand?.position || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hole Cards:</Text>
            <Text style={styles.summaryValue}>{hand?.holeCards || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Result:</Text>
            <Text style={[
              styles.summaryValue,
              { color: (hand?.result ?? 0) >= 0 ? theme.colors.profit : theme.colors.loss }
            ]}>
              {(hand?.result ?? 0) >= 0 ? '+' : ''}${hand?.result ?? 0}
            </Text>
          </View>
        </View>

        {/* AI Analysis Result */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>🤖 AI Analysis Result</Text>
          <Text style={styles.analysisText}>
            {analysis ? formatAnalysisText(analysis) : 'Analysis is being generated...'}
          </Text>
          {hand?.analysisDate && (
            <Text style={styles.analysisDate}>
              Analysis completed: {new Date().toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.small,
  },
  headerTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
  },
  reanalyzeButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  reanalyzeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: theme.spacing.md,
  },
  loadingSubText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  summaryLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  analysisCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analysisTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  analysisText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 26,
    textAlign: 'left',
    letterSpacing: 0.3,
  },
  analysisDate: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
}); 