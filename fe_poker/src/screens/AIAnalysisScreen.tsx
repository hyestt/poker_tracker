import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Hand } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '../viewmodels/sessionStore';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentHand, setCurrentHand] = useState<Hand>(route.params.hand);
  const { getHand, updateHand } = useSessionStore();

  console.log('AIAnalysisScreen mounted with hand:', currentHand);
  console.log('Hand has existing analysis:', !!currentHand.analysis);

  useEffect(() => {
    loadLatestHandData();
  }, []);

  const loadLatestHandData = async () => {
    try {
      // 從 sessionStore 加載最新的手牌數據
      const latestHand = await getHand(currentHand.id);
      console.log('Loaded latest hand data from sessionStore:', latestHand);
      console.log('Has existing analysis:', !!latestHand.analysis);
      
      setCurrentHand(latestHand);
      
      // 如果有分析結果，直接顯示
      if (latestHand.analysis) {
        console.log('✅ Found cached analysis, displaying it');
        setAnalysis(latestHand.analysis);
        setLoading(false);
        return;
      }
      
      // 沒有緩存的分析，執行新分析
      console.log('❌ No cached analysis found, performing new analysis');
      await performAIAnalysis();
    } catch (error) {
      console.error('Error loading hand data:', error);
      await performAIAnalysis();
    }
  };

  const performAIAnalysis = async (forceReanalyze = false) => {
    console.log('performAIAnalysis started, forceReanalyze:', forceReanalyze);
    console.log('Current hand analysis exists:', !!currentHand.analysis);
    console.log('Current hand analysis content:', currentHand.analysis ? 'YES' : 'NO');
    setLoading(true);
    try {
      // 檢查是否已有分析結果（除非強制重新分析）
      if (!forceReanalyze && currentHand.analysis) {
        console.log('✅ Using cached analysis, skipping API call');
        setAnalysis(currentHand.analysis);
        setLoading(false);
        return;
      }

      console.log('Performing new AI analysis...');
      // 執行真正的AI分析
      const analysisResult = await performRealAIAnalysis(currentHand);
      console.log('AI analysis completed:', analysisResult);
      
      // 更新hand數據
      const updatedHand = {
        ...currentHand,
        analysis: analysisResult,
        analysisDate: new Date().toLocaleDateString()
      };
      
      // 保存到 sessionStore（這會同時更新 localStorage）
      await updateHand(updatedHand);
      console.log('💾 Analysis saved to sessionStore and localStorage');
      
      // 更新組件中的 hand 對象
      setCurrentHand(updatedHand);
      console.log('✅ Hand analysis updated and cached');
      
      setAnalysis(analysisResult);
    } catch (error) {
      console.error('AI analysis error:', error);
      Alert.alert('Error', 'Failed to perform AI analysis');
    } finally {
      setLoading(false);
    }
  };

  // 真正的AI分析功能
  const performRealAIAnalysis = async (handData: Hand): Promise<string> => {
    try {
      // 確保必要欄位不為空
      const handPayload = {
        id: handData.id || 'unknown',
        position: handData.position || '',
        holeCards: handData.holeCards || '',
        board: handData.board || '',
        details: handData.details || '',
        result: handData.result || 0,
        villains: handData.villains || []
      };

      console.log('Sending AI analysis request:', handPayload);

      const API_URL = 'https://poker-production-12db.up.railway.app';
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hand: handPayload })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        console.error('Request details:', JSON.stringify({ hand: handPayload }, null, 2));
        
        // 顯示具體錯誤而不是回退到模擬
        Alert.alert('API Error', `Server returned ${response.status}: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('API analysis result received successfully');
      return result.analysis || 'No analysis available';
    } catch (error) {
      console.error('Real AI analysis error:', error);
      
      // 只有在網路錯誤時才回退到模擬分析
      if (error instanceof Error && (error.message.includes('Network request failed') || error.message.includes('fetch'))) {
        console.log('Network error detected, falling back to simulation');
        return await simulateAIAnalysis(handData);
      }
      
      // 其他錯誤直接拋出
      throw error;
    }
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

  const handleReanalyze = async () => {
    try {
      console.log('Re-analyzing hand, forcing new analysis...');
      // 清除顯示的分析結果，然後強制重新分析
      setAnalysis('');
      await performAIAnalysis(true); // 傳入 true 強制重新分析
    } catch (error) {
      console.error('Failed to reanalyze hand:', error);
      Alert.alert('Error', 'Failed to reanalyze hand');
    }
  };

  // 渲染 markdown 格式的分析結果
  const renderFormattedAnalysis = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('### ')) {
        // 處理 ### 標題
        const title = trimmedLine.replace('### ', '');
        elements.push(
          <Text key={index} style={styles.analysisSubTitle}>
            {title}
          </Text>
        );
      } else if (trimmedLine.startsWith('## ')) {
        // 處理 ## 標題
        const title = trimmedLine.replace('## ', '');
        elements.push(
          <Text key={index} style={styles.analysisTitle}>
            {title}
          </Text>
        );
      } else if (trimmedLine.startsWith('# ')) {
        // 處理 # 標題
        const title = trimmedLine.replace('# ', '');
        elements.push(
          <Text key={index} style={styles.analysisMainTitle}>
            {title}
          </Text>
        );
      } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        // 處理列表項目
        const listItem = trimmedLine.replace(/^[•\-] /, '');
        elements.push(
          <Text key={index} style={styles.analysisListItem}>
            • {listItem}
          </Text>
        );
      } else if (trimmedLine) {
        // 處理一般文字
        let formattedText = trimmedLine;
        // 處理粗體文字 **text**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const hasBold = boldRegex.test(formattedText);
        
        if (hasBold) {
          const parts = formattedText.split(boldRegex);
          const textElements: React.ReactNode[] = [];
          parts.forEach((part, partIndex) => {
            if (partIndex % 2 === 1) {
              // 奇數索引是粗體文字
              textElements.push(
                <Text key={partIndex} style={styles.analysisBoldText}>
                  {part}
                </Text>
              );
            } else if (part) {
              textElements.push(part);
            }
          });
          elements.push(
            <Text key={index} style={styles.analysisText}>
              {textElements}
            </Text>
          );
        } else {
          elements.push(
            <Text key={index} style={styles.analysisText}>
              {formattedText}
            </Text>
          );
        }
      } else {
        // 空行作為間距
        elements.push(<View key={index} style={{ height: 8 }} />);
      }
    });
    
    return elements;
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
        <Text style={styles.headerTitle}>GTO Analysis</Text>
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
            <Text style={styles.summaryValue}>{currentHand.position || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hole Cards:</Text>
            <Text style={styles.summaryValue}>{currentHand.holeCards || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Result:</Text>
            <Text style={[
              styles.summaryValue,
              { color: currentHand.result >= 0 ? theme.colors.profit : theme.colors.loss }
            ]}>
              {currentHand.result >= 0 ? '+' : ''}${currentHand.result}
            </Text>
          </View>
        </View>

        {/* GTO Analysis Result */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisCardTitle}>GTO Analysis Result</Text>
          <View style={styles.analysisContent}>
            {analysis ? renderFormattedAnalysis(analysis) : (
              <Text style={styles.analysisText}>Analysis is being generated...</Text>
            )}
          </View>
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
  analysisCardTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  analysisContent: {
    flex: 1,
  },
  analysisMainTitle: {
    fontSize: theme.font.size.large,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  analysisTitle: {
    fontSize: theme.font.size.body + 2,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  analysisSubTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  analysisText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: theme.spacing.xs,
  },
  analysisBoldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  analysisListItem: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  analysisDate: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
}); 