import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Hand } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { hand } = route.params;

  console.log('AIAnalysisScreen mounted with hand:', hand);

  useEffect(() => {
    performAIAnalysis();
  }, []);

  const performAIAnalysis = async () => {
    console.log('performAIAnalysis started');
    setLoading(true);
    try {
      // 檢查是否已有分析結果
      if (hand.analysis) {
        console.log('Found existing analysis:', hand.analysis);
        setAnalysis(hand.analysis);
        setLoading(false);
        return;
      }

      console.log('Performing new AI analysis...');
      // 執行真正的AI分析
      const analysisResult = await performRealAIAnalysis(hand);
      console.log('AI analysis completed:', analysisResult);
      
      // 更新hand數據
      const updatedHand = {
        ...hand,
        analysis: analysisResult,
        analysisDate: new Date().toLocaleDateString()
      };
      
      // 保存到localStorage
      const existingHands = await AsyncStorage.getItem('poker_hands');
      if (existingHands) {
        const hands = JSON.parse(existingHands);
        const handIndex = hands.findIndex((h: any) => h.id === hand.id);
        if (handIndex !== -1) {
          hands[handIndex] = updatedHand;
          await AsyncStorage.setItem('poker_hands', JSON.stringify(hands));
          console.log('Analysis saved to localStorage');
        }
      }
      
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
    console.log('Re-analyzing hand, clearing old analysis...');
    // 清除現有分析並強制重新分析
    hand.analysis = undefined;
    hand.analysisDate = undefined;
    setAnalysis('');
    await performAIAnalysis();
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
            <Text style={styles.summaryValue}>{hand.position || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hole Cards:</Text>
            <Text style={styles.summaryValue}>{hand.holeCards || 'Unknown'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Result:</Text>
            <Text style={[
              styles.summaryValue,
              { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss }
            ]}>
              {hand.result >= 0 ? '+' : ''}${hand.result}
            </Text>
          </View>
        </View>

        {/* AI Analysis Result */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisCardTitle}>🤖 AI Analysis Result</Text>
          <View style={styles.analysisContent}>
            {analysis ? renderFormattedAnalysis(analysis) : (
              <Text style={styles.analysisText}>Analysis is being generated...</Text>
            )}
          </View>
          {hand.analysisDate && (
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