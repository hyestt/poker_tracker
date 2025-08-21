import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { Hand } from '../models';
import { useSessionStore } from '../viewmodels/sessionStore';
import revenueCatService from '../services/RevenueCatService';
import { UserPreferencesService } from '../services/UserPreferences';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [sections, setSections] = useState<{ summary: string; preflop: string; flop: string; turn: string; river: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'preflop' | 'flop' | 'turn' | 'river'>('summary');
  const [loading, setLoading] = useState(true);
  const [currentHand, setCurrentHand] = useState<Hand>(route.params.hand);
  const [quotaInfo, setQuotaInfo] = useState<{canUse: boolean; isPremium: boolean; remainingFree: number; needsPremium: boolean} | null>(null);
  const { getHand, updateHand } = useSessionStore();
  const insets = useSafeAreaInsets();

  console.log('AIAnalysisScreen mounted with hand:', currentHand);
  console.log('Hand has existing analysis:', !!currentHand.analysis);

  useEffect(() => {
    checkGTOQuotaAndLoadData();
  }, []);

  // 在此頁隱藏所有上層的 TabBar（包含多層 Navigator）
  const setAllParentsTabBarDisplay = (display: 'none' | 'flex') => {
    let parent: any = navigation?.getParent?.();
    let depth = 0;
    while (parent && depth < 5) {
      try { parent.setOptions?.({ tabBarStyle: { display } }); } catch {}
      parent = parent.getParent?.();
      depth += 1;
    }
  };

  useEffect(() => {
    setAllParentsTabBarDisplay('none');
    return () => setAllParentsTabBarDisplay('none');
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      setAllParentsTabBarDisplay('none');
      return () => setAllParentsTabBarDisplay('none');
    }, [navigation])
  );

  // 將 Re-analyze 放到右上角 header（在定義函式之後再設定）

  const checkGTOQuotaAndLoadData = async () => {
    try {
      // Check GTO analysis quota first
      const quotaStatus = await revenueCatService.canUseGTOAnalysis();
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
        
        // 只使用後端提供或已存的 sections。若不存在，全部顯示於 Summary。
        if (latestHand.analysisSections) {
          try {
            const parsed = JSON.parse(latestHand.analysisSections);
            setSections(parsed);
          } catch (e) {
            console.warn('Failed to parse stored sections JSON, using Summary-only fallback');
            setSections({ summary: latestHand.analysis, preflop: '', flop: '', turn: '', river: '' });
          }
        } else {
          setSections({ summary: latestHand.analysis, preflop: '', flop: '', turn: '', river: '' });
        }
        // 設定第一個有內容的分頁
        setActiveTab('summary');
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
    const quotaStatus = await revenueCatService.canUseGTOAnalysis();
    setQuotaInfo(quotaStatus);

    if (!quotaStatus.canUse && (forceReanalyze || !currentHand.analysis)) {
      Alert.alert(
        'GTO Analysis Limit Reached',
        quotaStatus.isPremium
          ? 'Please try again later.'
          : 'You\'ve used your 15 free weekly GTO analyses. Upgrade to Premium for unlimited analysis.',
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
      const quotaUsed = await revenueCatService.useGTOAnalysis();
      if (!quotaUsed) {
        Alert.alert('Error', 'Unable to use GTO analysis at this time');
        setLoading(false);
        return;
      }

      // Update quota info after using analysis
      const updatedQuotaStatus = await revenueCatService.canUseGTOAnalysis();
      setQuotaInfo(updatedQuotaStatus);

      // Execute the actual AI analysis
      const analysisResult = await performRealAIAnalysis(currentHand);
      console.log('AI analysis completed:', analysisResult);

      // Update hand data
      const updatedHand = {
        ...currentHand,
        analysis: analysisResult.text,
        analysisDate: new Date().toLocaleDateString(),
        analysisSections: analysisResult.sections ? JSON.stringify(analysisResult.sections) : undefined,
      };

      // Save to sessionStore (this also updates localStorage)
      await updateHand(updatedHand);
      console.log('💾 Analysis saved to sessionStore and localStorage');

      // Update the component's hand object
      setCurrentHand(updatedHand);
      console.log('✅ Hand analysis updated and cached');

      setAnalysis(analysisResult.text);
      // 僅使用後端 sections；缺失時以 Summary-only 呈現
      const s = analysisResult.sections || { summary: analysisResult.text, preflop: '', flop: '', turn: '', river: '' };
      setSections(s);
      setActiveTab(getFirstAvailableTab(s));
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
  const performRealAIAnalysis = async (handData: Hand): Promise<{ text: string; sections?: { summary: string; preflop: string; flop: string; turn: string; river: string } }> => {
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
      console.log('🔍 Raw API result:', JSON.stringify(result, null, 2));
      const apiText: string = result.analysis || 'No analysis available';
      const apiSections = result.sections as { summary: string; preflop: string; flop: string; turn: string; river: string } | undefined;
      console.log('🔍 Extracted sections:', JSON.stringify(apiSections, null, 2));
      return { text: apiText, sections: apiSections };
    } catch (error) {
      console.error('Real AI analysis error:', error);

      // 只有在網路錯誤時才回退到模擬分析
      if (error instanceof Error && (error.message.includes('Network request failed') || error.message.includes('fetch'))) {
        console.log('Network error detected, falling back to simulation');
        const fallbackText = await simulateAIAnalysis(handData);
        return { text: fallbackText };
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
  // 前端備援解析已移除：新手牌僅依賴後端 sections；無 sections 時以 Summary-only 呈現

  const getFirstAvailableTab = (s: { summary: string; preflop: string; flop: string; turn: string; river: string }) => {
    if (s.summary?.trim()) {return 'summary' as const;}
    if (s.preflop?.trim()) {return 'preflop' as const;}
    if (s.flop?.trim()) {return 'flop' as const;}
    if (s.turn?.trim()) {return 'turn' as const;}
    if (s.river?.trim()) {return 'river' as const;}
    return 'summary' as const;
  };


  // 將 Re-analyze 放到右上角 header（確保在函式定義之後）
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleReanalyze} style={styles.reanalyzeHeaderButton}>
          <Text style={styles.reanalyzeHeaderButtonText}>Re-analyze</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleReanalyze]);

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
        {/* Quota Exceeded Message */}
        <View style={styles.quotaExceededContainer}>
          <Text style={styles.quotaExceededIcon}>🎯</Text>
          <Text style={styles.quotaExceededTitle}>Weekly Analysis Limit Reached</Text>
          <Text style={styles.quotaExceededMessage}>
            {quotaInfo.isPremium
              ? 'You\'ve reached your analysis limit for this week. Please try again next week.'
              : 'You\'ve used your 15 free GTO analyses for this week. Upgrade to Premium for unlimited analysis.'}
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
      {/* Content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing.xl * 3 + Math.max(insets.bottom, theme.spacing.lg) }]}>
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
            {sections ? (
              <>
                {activeTab === 'summary' && renderFormattedAnalysis(sections.summary)}
                {activeTab === 'preflop' && renderFormattedAnalysis(sections.preflop)}
                {activeTab === 'flop' && renderFormattedAnalysis(sections.flop)}
                {activeTab === 'turn' && renderFormattedAnalysis(sections.turn)}
                {activeTab === 'river' && renderFormattedAnalysis(sections.river)}
              </>
            ) : (
              analysis ? renderFormattedAnalysis(analysis) : (
                <Text style={styles.analysisText}>Analysis is being generated...</Text>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      {sections && (
        <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
          {(
            [
              { key: 'summary', label: 'Summary' },
              { key: 'preflop', label: 'Preflop' },
              { key: 'flop', label: 'Flop' },
              { key: 'turn', label: 'Turn' },
              { key: 'river', label: 'River' },
            ] as const
          ).map((t) => {
            const disabled = !((sections as any)[t.key]?.trim());
            const isActive = activeTab === (t.key as any);
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabItem, isActive && styles.tabItemActive, disabled && styles.tabItemDisabled]}
                onPress={() => !disabled && setActiveTab(t.key as any)}
                disabled={disabled}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive, disabled && styles.tabTextDisabled]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
  reanalyzeHeaderButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.button,
    marginRight: theme.spacing.xs,
  },
  reanalyzeHeaderButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.small,
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
  bottomTabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: theme.colors.primary,
  },
  tabItemDisabled: {
    opacity: 0.4,
  },
  tabText: {
    color: theme.colors.text,
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextDisabled: {
    color: theme.colors.gray,
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
