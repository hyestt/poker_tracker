import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Hand } from '../models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSessionStore } from '../viewmodels/sessionStore';
import RevenueCatService from '../services/RevenueCatService';
import { UserPreferencesService } from '../services/UserPreferences';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentHand, setCurrentHand] = useState<Hand>(route.params.hand);
  const [quotaInfo, setQuotaInfo] = useState<{canUse: boolean; isPremium: boolean; remainingFree: number; needsPremium: boolean} | null>(null);
  const { getHand, updateHand } = useSessionStore();

  console.log('AIAnalysisScreen mounted with hand:', currentHand);
  console.log('Hand has existing analysis:', !!currentHand.analysis);

  useEffect(() => {
    checkGTOQuotaAndLoadData();
  }, []);

  const checkGTOQuotaAndLoadData = async () => {
    try {
      // Check GTO analysis quota first
      const quotaStatus = await RevenueCatService.canUseGTOAnalysis();
      setQuotaInfo(quotaStatus);

      console.log('GTO Quota Status:', quotaStatus);

      // If user can't use GTO analysis and hand has no existing analysis, show quota message
      if (!quotaStatus.canUse && !currentHand.analysis) {
        setLoading(false);
        return;
      }

      // Proceed with loading hand data
      await loadLatestHandData();
    } catch (error) {
      console.error('Error checking GTO quota:', error);
      await loadLatestHandData(); // Continue with normal flow on error
    }
  };

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

    // Check quota before starting analysis
    const quotaStatus = await RevenueCatService.canUseGTOAnalysis();
    setQuotaInfo(quotaStatus);

    if (!quotaStatus.canUse && (forceReanalyze || !currentHand.analysis)) {
      Alert.alert(
        'GTO Analysis Limit Reached',
        quotaStatus.isPremium
          ? 'Please try again later.'
          : 'You\'ve used your free daily GTO analysis. Upgrade to Premium for unlimited analysis.',
        quotaStatus.isPremium
          ? [{ text: 'OK' }]
          : [
              { text: 'Maybe Later', style: 'cancel' },
              { text: 'Upgrade to Premium', onPress: () => navigation.navigate('Subscription') },
            ]
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Check if we already have analysis (unless forcing reanalysis)
      if (!forceReanalyze && currentHand.analysis) {
        console.log('✅ Using cached analysis, skipping API call');
        setAnalysis(currentHand.analysis);
        setLoading(false);
        return;
      }

      console.log('Performing new AI analysis...');

      // Use the quota (this increments the counter for non-premium users)
      const quotaUsed = await RevenueCatService.useGTOAnalysis();
      if (!quotaUsed) {
        Alert.alert('Error', 'Unable to use GTO analysis at this time');
        setLoading(false);
        return;
      }

      // Update quota info after using analysis
      const updatedQuotaStatus = await RevenueCatService.canUseGTOAnalysis();
      setQuotaInfo(updatedQuotaStatus);

      // Execute the actual AI analysis
      const analysisResult = await performRealAIAnalysis(currentHand);
      console.log('AI analysis completed:', analysisResult);

      // Update hand data
      const updatedHand = {
        ...currentHand,
        analysis: analysisResult,
        analysisDate: new Date().toLocaleDateString(),
      };

      // Save to sessionStore (this also updates localStorage)
      await updateHand(updatedHand);
      console.log('💾 Analysis saved to sessionStore and localStorage');

      // Update the component's hand object
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

  // 生成完整的手牌歷史文本（類似 Share 功能）
  const generateHandHistoryText = (handData: Hand): string => {
    const villainText = handData.villains?.map((v, i) =>
      `Villain ${i + 1}: ${v.position || 'Unknown'} - ${v.holeCards || 'Unknown'}`
    ).join('\n') || 'No villains';

    return `Poker Hand Details

Hero: ${handData.position || 'Unknown'} - ${handData.holeCards || 'Unknown'}
Board: ${handData.board || 'No flop shown'}

Villains:
${villainText}

Hand Details:
${handData.details || 'No details'}

Note:
${handData.note || 'No note'}

Result: ${handData.result >= 0 ? '+' : ''}$${handData.result}`;
  };

  // 真正的AI分析功能
  const performRealAIAnalysis = async (handData: Hand): Promise<string> => {
    try {
      // 獲取用戶語言設定
      const userPreferences = await UserPreferencesService.getPreferences();
      const userLanguage = userPreferences.language || 'English';
      
      // 生成完整的手牌歷史文本
      const handHistoryText = generateHandHistoryText(handData);
      
      const requestPayload = {
        handDetails: handHistoryText,
        language: userLanguage,
      };

      console.log('Sending AI analysis request:', requestPayload);

      const API_URL = 'https://poker-production-12db.up.railway.app';
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        console.error('Request details:', JSON.stringify(requestPayload, null, 2));

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
      analysis += 'Strong starting hand with premium cards.\n\n';
    } else {
      analysis += 'Consider position and stack sizes with this holding.\n\n';
    }

    analysis += `🎲 Board Analysis:\n${board}\n\n`;

    analysis += '💰 Result Analysis:\n';
    if (result > 0) {
      analysis += `Won $${result} - Positive outcome achieved.\n`;
      analysis += 'The play execution appears to have been effective.\n\n';
      analysis += '📈 Recommendations:\n';
      analysis += '• Continue applying similar strategy in comparable spots\n';
      analysis += '• Review the decision points that led to this success\n';
      analysis += '• Consider this line in similar board textures';
    } else {
      analysis += `Lost $${Math.abs(result)} - Learning opportunity identified.\n`;
      analysis += 'Every loss provides valuable feedback for improvement.\n\n';
      analysis += '📉 Areas for Review:\n';
      analysis += `• Pre-flop decision making from ${position}\n`;
      analysis += '• Post-flop betting patterns and sizing\n';
      analysis += '• Consider tighter range selection in this position\n';
      analysis += '• Review opponent tendencies and adjust accordingly';
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
    if (!text) {return null;}

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
          <View key={index} style={styles.listItemContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.analysisListItem}>
              {renderTextWithFormatting(listItem)}
            </Text>
          </View>
        );
      } else if (trimmedLine) {
        // 處理一般文字
        elements.push(
          <Text key={index} style={styles.analysisText}>
            {renderTextWithFormatting(trimmedLine)}
          </Text>
        );
      } else {
        // 空行作為間距
        elements.push(<View key={index} style={{ height: 8 }} />);
      }
    });

    return elements;
  };

  // 渲染包含格式化文字的函數
  const renderTextWithFormatting = (text: string) => {
    if (!text) {return text;}

    // 檢查整行是否是粗體標題格式 (如 **Summary** 或 **Player Action:**)
    const wholeBoldMatch = text.match(/^\*\*(.+?)\*\*:?$/);
    if (wholeBoldMatch) {
      return (
        <Text style={styles.analysisBoldText}>
          {wholeBoldMatch[1]}{text.endsWith(':') ? ':' : ''}
        </Text>
      );
    }

    // 處理混合文字中的粗體部分 **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = text.split(boldRegex);
    const elements: React.ReactNode[] = [];

    parts.forEach((part, partIndex) => {
      if (partIndex % 2 === 1) {
        // 奇數索引是粗體文字
        elements.push(
          <Text key={partIndex} style={styles.analysisBoldText}>
            {part}
          </Text>
        );
      } else if (part) {
        // 普通文字，保持原樣（包括撲克牌符號）
        elements.push(part);
      }
    });

    return elements.length > 1 ? elements : text;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>GTO is analyzing your hand...</Text>
        <Text style={styles.loadingSubText}>This may take a few seconds</Text>
      </View>
    );
  }

  // Show quota exceeded message if user can't use analysis and no existing analysis
  if (quotaInfo && !quotaInfo.canUse && !currentHand.analysis) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GTO Analysis</Text>
          <View style={styles.reanalyzeButton} />
        </View>

        {/* Quota Exceeded Message */}
        <View style={styles.quotaExceededContainer}>
          <Text style={styles.quotaExceededIcon}>🎯</Text>
          <Text style={styles.quotaExceededTitle}>Daily Analysis Limit Reached</Text>
          <Text style={styles.quotaExceededMessage}>
            {quotaInfo.isPremium
              ? 'You\'ve reached your analysis limit for today. Please try again tomorrow.'
              : 'You\'ve used your 1 free GTO analysis for today. Upgrade to Premium for unlimited daily analysis.'}
          </Text>

          {!quotaInfo.isPremium && (
            <TouchableOpacity
              style={styles.upgradeToPremiumButton}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeToPremiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
              { color: currentHand.result >= 0 ? theme.colors.profit : theme.colors.loss },
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
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quotaIndicator: {
    backgroundColor: theme.colors.inputBg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  quotaText: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  quotaExceededContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  quotaExceededIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  quotaExceededTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  quotaExceededMessage: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  upgradeToPremiumButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    marginBottom: theme.spacing.md,
  },
  upgradeToPremiumButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: theme.font.size.body,
    textAlign: 'center',
  },
  goBackButton: {
    backgroundColor: theme.colors.inputBg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
  },
  goBackButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: theme.font.size.body,
    textAlign: 'center',
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
    fontSize: theme.font.size.title,
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
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  bulletPoint: {
    fontSize: theme.font.size.body,
    color: theme.colors.primary,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
    lineHeight: 22,
  },
  analysisListItem: {
    flex: 1,
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  analysisDate: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});
