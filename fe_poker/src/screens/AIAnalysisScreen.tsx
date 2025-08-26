import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { theme } from '../theme';
import { buildFrequenciesViewModel } from '../viewmodels/FrequenciesViewModel';
import { FrequenciesChart } from '../components/FrequenciesChart';
import { Hand, Session } from '../models';
import { useSessionStore } from '../viewmodels/sessionStore';
import revenueCatService from '../services/RevenueCatService';
import { UserPreferencesService } from '../services/UserPreferences';
import { generateShareText } from '../utils/handTextGenerator';

// 將撲克牌符號轉換為完整英文表示
const convertCardSymbolsToEnglish = (cardString: string): string => {
  if (!cardString) return cardString;
  
  return cardString
    .replace(/♠/g, ' of spades')    // 黑桃 → of spades
    .replace(/♥/g, ' of hearts')    // 紅心 → of hearts  
    .replace(/♦/g, ' of diamonds')  // 方塊 → of diamonds
    .replace(/♣/g, ' of clubs');    // 梅花 → of clubs
};
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export const AIAnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analysis, setAnalysis] = useState<string>('');
  // sections 支援字串或物件（物件包含 frequencies/recommendation 等欄位）
  const [sections, setSections] = useState<{ summary: any; preflop: any; flop: any; turn: any; river: any } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'preflop' | 'flop' | 'turn' | 'river'>('summary');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing AI Solver...');
  const progressAnim = useState(new Animated.Value(0))[0];
  const [currentHand, setCurrentHand] = useState<Hand>(route.params.hand);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{canUse: boolean; isPremium: boolean; remainingFree: number; needsPremium: boolean} | null>(null);
  const { getHand, getSession, updateHand } = useSessionStore();
  const insets = useSafeAreaInsets();

  // Progress animation function
  const simulateProgress = () => {
    const messages = [
      'Initializing AI Solver...',
      'Analyzing preflop strategy...',
      'Calculating flop frequencies...',
      'Evaluating turn decisions...',
      'Processing river scenarios...',
      'Generating recommendations...',
      'Finalizing analysis...',
    ];

    let currentStep = 0;
    setLoadingProgress(0);
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      currentStep++;
      // Progress only goes up to 90% (90% * currentStep / messages.length)
      const progress = Math.min((currentStep / messages.length) * 90, 90);
      setLoadingProgress(progress);

      if (currentStep < messages.length) {
        setLoadingMessage(messages[currentStep]);
      }

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Stop at 90% and wait for actual completion
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 2571); // 18 seconds / 7 steps ≈ 2.571 seconds per step

    return interval;
  };

  // Function to complete progress to 100%
  const completeProgress = () => {
    setLoadingProgress(100);
    setLoadingMessage('Analysis complete!');

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

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
    // 進入與離開都強制隱藏
    const hide = () => setAllParentsTabBarDisplay('none');
    hide();
    const unsub = navigation.addListener('state', hide);
    return () => {
      unsub?.();
      hide();
    };
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

      // 同時加載 session 資訊
      const session = await getSession(latestHand.sessionId);
      console.log('Loaded session data:', session);

      setCurrentHand(latestHand);
      setCurrentSession(session);

      // 如果有分析結果，直接顯示
      if (latestHand.analysis) {
        console.log('✅ Found cached analysis, displaying it');
        setAnalysis(latestHand.analysis);

        // 使用已存的 sections（本地 SQLite 或 API 回存）
        if (latestHand.analysisSections && latestHand.analysisSections.trim()) {
          try {
            const parsed = JSON.parse(latestHand.analysisSections);
            setSections(parsed);
            setActiveTab(getFirstAvailableTab(parsed));
            setLoading(false);
            return;
          } catch (e) {
            console.warn('Failed to parse stored sections JSON, using Preflop-only fallback');
            setSections({ summary: '', preflop: latestHand.analysis, flop: '', turn: '', river: '' });
            setActiveTab('preflop');
            setLoading(false);
            return;
          }
        } else {
          setSections({ summary: '', preflop: latestHand.analysis, flop: '', turn: '', river: '' });
          setActiveTab('preflop');
          setLoading(false);
          return;
        }
      }

      // 沒有緩存的分析，執行新分析（明確傳遞 session 以避免 state 尚未就緒）
      console.log('❌ No cached analysis found, performing new analysis');
      await performAIAnalysis(false, session);
    } catch (error) {
      console.error('Error loading hand data:', error);
      await performAIAnalysis(false, null);
    }
  };

  const performAIAnalysis = async (forceReanalyze = false, sessionOverride: Session | null = null) => {
    console.log('performAIAnalysis started, forceReanalyze:', forceReanalyze);
    console.log('Current hand analysis exists:', !!currentHand.analysis);
    console.log('Current hand analysis content:', currentHand.analysis ? 'YES' : 'NO');

    // 移除前置 canUse 檢查，改為使用 useGTOAnalysis 作為 gate，並在完成後背景刷新配額

    setLoading(true);
    const progressInterval = simulateProgress();

    try {
      // Check if we already have analysis (unless forcing reanalysis)
      if (!forceReanalyze && currentHand.analysis) {
        console.log('✅ Using cached analysis, skipping API call');
        completeProgress();
        clearInterval(progressInterval);
        setAnalysis(currentHand.analysis);
        setLoading(false);
        return;
      }

      console.log('Performing new AI analysis...');

      // Use the quota (this increments the counter for non-premium users)
      const quotaUsed = await revenueCatService.useGTOAnalysis();
      if (!quotaUsed) {
        Alert.alert('Error', 'Unable to use GTO analysis at this time');
        clearInterval(progressInterval);
        setLoading(false);
        return;
      }

      // 背景刷新配額資訊（不阻塞分析）
      revenueCatService.canUseGTOAnalysis().then(setQuotaInfo).catch(() => {});

      // Execute the actual AI analysis（優先使用傳入的 sessionOverride）
      const analysisResult = await performRealAIAnalysis(currentHand, sessionOverride ?? currentSession);
      console.log('AI analysis completed:', analysisResult);

      // Complete progress to 100%
      completeProgress();

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
      const s = analysisResult.sections || { summary: '', preflop: analysisResult.text, flop: '', turn: '', river: '' };
      setSections(s);
      setActiveTab(getFirstAvailableTab(s));
    } catch (error) {
      console.error('AI analysis error:', error);
      Alert.alert('Error', 'Failed to perform AI analysis');
      clearInterval(progressInterval);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };



  // 真正的AI分析功能
  const performRealAIAnalysis = async (handData: Hand, sessionForRequest: Session | null = null): Promise<{ text: string; sections?: { summary: any; preflop: any; flop: any; turn: any; river: any } }> => {
    try {
      // 獲取用戶語言設定
      const userPreferences = await UserPreferencesService.getPreferences();
      const userLanguage = userPreferences.language || 'English';

      // 生成完整的手牌歷史文本（使用Share格式，但移除"Shared from AI Solver"標記）
      // 若首次點擊時 session 尚未載入，使用最小可用內容作為後備，避免第一次就失敗
      let handHistoryText = '';
      const sessionToUse = sessionForRequest || currentSession;
      if (sessionToUse) {
        const shareText = generateShareText(handData, sessionToUse);
        // 僅用於發送給 AI 的文本：轉換花色為完整英文，分享與 UI 不受影響
        handHistoryText = convertCardSymbolsToEnglish(
          shareText.replace('\n\nShared from AI Solver', '')
        );
      } else {
        const villainsText = (handData.villains || [])
          .map((v, i) => `Villain ${i + 1}: ${v.position || 'Unknown'} - ${convertCardSymbolsToEnglish(v.holeCards || 'Unknown')}`)
          .join('\n');
        handHistoryText = [
          'Poker Hand Details',
          '',
          `Hero: ${handData.position || 'Unknown'} - ${convertCardSymbolsToEnglish(handData.holeCards || 'Unknown')}`,
          `Board: ${convertCardSymbolsToEnglish(handData.board || 'No flop shown')}`,
          villainsText ? `Villains:\n${villainsText}` : 'Villains: None',
          '',
          'Hand Details:',
          handData.details || 'No details',
        ].join('\n');
      }

      // 若沒有可用的 session，直接提示並中止呼叫，避免 400
      if (!sessionToUse || sessionToUse.smallBlind == null || sessionToUse.bigBlind == null) {
        Alert.alert('Missing Session Info', 'Please ensure the session includes blinds (e.g., 1/2) before AI analysis.');
        throw new Error('Session blinds missing');
      }

      const requestPayload: any = {
        hero_position: handData.position || '',
        hero_hole_cards: convertCardSymbolsToEnglish(handData.holeCards || ''),
        board: convertCardSymbolsToEnglish(handData.board || ''),
        // Notes/result/location/table_size/stack_size intentionally omitted per backend contract
        session: {
          small_blind: String((sessionToUse as any).smallBlind ?? ''),
          big_blind: String((sessionToUse as any).bigBlind ?? ''),
          date: (sessionToUse as any).date || '',
        },
        villains: (handData.villains || []).map((v: any, i: number) => ({
          id: v.id || String(i + 1),
          position: v.position || '',
          hole_cards: convertCardSymbolsToEnglish(v.holeCards || ''),
        })),
        handDetails: handHistoryText,
        language: userLanguage,
      };

      // 注入使用者在設定中的模型偏好（若有）
      try {
        const prefs = await UserPreferencesService.getPreferences();
        if (prefs.aiModel && prefs.aiModel.trim()) {
          requestPayload.model = prefs.aiModel.trim();
        }
      } catch {}

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
      // 優先使用後端提供的 analysis_object（完整物件），否則退回 sections
      let apiSections = (result.analysis_object as any) || (result.sections as any);

      // 最後備援：若 sections 缺失但 analysis 是可解析的 JSON（常見於只返回某一街道的情況），嘗試從 analysis 建立物件 sections
      if (!apiSections) {
        const trimmed = (apiText || '').trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed && typeof parsed === 'object') {
              apiSections = {
                preflop: parsed.preflop ?? undefined,
                flop: parsed.flop ?? undefined,
                turn: parsed.turn ?? undefined,
                river: parsed.river ?? undefined,
              } as any;
            }
          } catch {/* ignore */}
        }
      }

      // 若物件存在但所有街道都沒有可用內容，回退為 undefined 使用 text 解析
      const hasStreetContent = (street: any) => {
        if (!street) {return false;}
        if (typeof street === 'string') {return !!street.trim();}
        if (typeof street === 'object') {
          const freqLen = street.frequencies && typeof street.frequencies === 'object' ? Object.keys(street.frequencies).length : 0;
          const hasText = !!(street.player_action && String(street.player_action).trim()) || !!(street.recommendation && String(street.recommendation).trim()) || !!(street.rating && String(street.rating).trim());
          return hasText || freqLen > 0;
        }
        return false;
      };
      if (apiSections && !hasStreetContent(apiSections.preflop) && !hasStreetContent(apiSections.flop) && !hasStreetContent(apiSections.turn) && !hasStreetContent(apiSections.river)) {
        apiSections = undefined as any;
      }

      console.log('🔍 Extracted sections (prefer object, with analysis fallback):', JSON.stringify(apiSections, null, 2));
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
    await new Promise<void>(resolve => setTimeout(resolve, 3000));

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

  const getFirstAvailableTab = (s: { summary: any; preflop: any; flop: any; turn: any; river: any }) => {
    const hasContent = (v: any) => {
      if (v == null) {return false;}
      if (typeof v === 'string') {return Boolean(v.trim());}
      if (typeof v === 'object') {
        return Boolean(v.summary || v.recommendation || v.player_action || (v.frequencies && Object.keys(v.frequencies).length > 0) || v.rating);
      }
      return false;
    };
    // 不再使用 summary 作為可選 tab
    if (hasContent(s.preflop)) {return 'preflop' as const;}
    if (hasContent(s.flop)) {return 'flop' as const;}
    if (hasContent(s.turn)) {return 'turn' as const;}
    if (hasContent(s.river)) {return 'river' as const;}
    // 若皆無，回退到 preflop（避免選到已移除的 summary）
    return 'preflop' as const;
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

  // 將頻率 key 轉為友好顯示
  const frequencyLabel = (key: string) => {
    const map: Record<string, string> = {
      raise_3x: 'Raise 3X',
      raise_5x: 'Raise 5X',
      check: 'Check',
      fold: 'Fold',
      bet_33: 'Bet 33%',
      bet_50: 'Bet 50%',
      bet_75: 'Bet 75%',
      bet_100: 'Bet 100%',
      overbet: 'Overbet',
    };
    return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // 以花色顏色渲染撲克牌文字（♠黑、♥紅、♦藍、♣綠）
  const renderColoredCardsText = (value?: string) => {
    if (!value || !value.trim()) {return 'Unknown';}
    const colorMap: Record<string, string> = {
      '♠': '#FFFFFF', // 黑桃
      '♥': '#FF4C4C', // 紅心
      '♦': '#FF4C4C', // 方塊
      '♣': '#4CAF50', // 梅花
    };
    const tokens = value.split(/\s+/).filter(Boolean);
    const nodes: React.ReactNode[] = [];
    tokens.forEach((tok, idx) => {
      const suit = tok.slice(-1);
      const rank = tok.slice(0, -1);
      const color = colorMap[suit] || theme.colors.primary;
      nodes.push(
        <Text key={`c-${idx}`} style={{ color }}>{rank}{suit}</Text>
      );
      if (idx < tokens.length - 1) {nodes.push(<Text key={`c-sp-${idx}`}> </Text>);}
    });
    return nodes;
  };

  // 將 rating 正規化為多顆星的顯示（1~5 顆）
  const renderRatingStars = (value: any) => {
    const raw = String(value || '').trim();
    // 先數已有的星星（含變體）
    const starCount = (raw.match(/[⭐★]/g) || []).length;
    if (starCount >= 1 && starCount <= 5) {
      return '⭐'.repeat(starCount);
    }
    // 嘗試擷取 1-5 的數字：若有多個（例如 "1-5" 範例字樣），取最大值避免誤判為 1
    const digits = raw.match(/[1-5]/g);
    if (digits && digits.length > 0) {
      const n = Math.max(...digits.map(d => parseInt(d, 10)));
      return '⭐'.repeat(n);
    }
    // 否則回傳原字串（避免隱藏資訊）
    return raw || '';
  };

  // 以標籤區塊方式渲染（優先）：支援「物件 JSON」與「標籤字串」兩種格式
  const renderStructuredAnalysis = (input: any) => {
    if (!input) {return null;}

    try {
      // 若為 JSON 字串，先嘗試解析
      if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try { 
            const parsed = JSON.parse(trimmed);
            return renderFromObject(parsed); 
          } catch {
            // JSON 解析失敗，回退到字串渲染
          }
        }
        // 否則走字串標籤解析
        return renderFromLabeledString(trimmed);
      }

      // 若為物件，直接渲染
      if (typeof input === 'object' && input !== null) {
        return renderFromObject(input);
      }

      return null;
    } catch (error) {
      // 如果渲染出錯，回退到簡單文字顯示
      return <Text style={styles.analysisText}>Analysis rendering error</Text>;
    }
  };

  const renderFromObject = (obj: any) => {
    const nodes: React.ReactNode[] = [];

    const pushText = (title: string, value?: string) => {
      if (!value || !String(value).trim()) {return;}
      nodes.push(
        <Text key={`h-${title}`} style={[styles.analysisSubTitle, { marginTop: nodes.length ? theme.spacing.md : 0 }]}>
          {title}
        </Text>
      );
      nodes.push(
        <Text key={`c-${title}`} style={styles.analysisText}>{value}</Text>
      );
    };

    // Rating 置頂（Summary 或街道）
    if (obj.rating) {
      nodes.push(
        <Text key={'rating'} style={[styles.analysisSubTitle, { marginTop: 0 }]}>Rating</Text>
      );
      nodes.push(
        <Text key={'rating-val'} style={styles.analysisText}>
          {renderRatingStars(obj.rating)}
        </Text>
      );
    }

    // Frequencies 物件（放在 Rating 下方）
    try {
      if (obj && typeof obj === 'object' && obj.frequencies && typeof obj.frequencies === 'object') {
        const vm = buildFrequenciesViewModel(obj.frequencies as Record<string, unknown>);
        if (vm && vm.entries && vm.entries.length > 0) {
          // 只在有非 0% 的數據時顯示圖表
          nodes.push(
            <View key={'freq-chart'} style={{ marginTop: nodes.length ? theme.spacing.md : 0 }}>
              <FrequenciesChart entries={vm.entries} noteMayNotSum100={vm.mayNotSum100} />
            </View>
          );
        } else {
          // 沒有非 0% 的數據時，完全不顯示備援清單，避免出現一堆 0%
        }
      }
    } catch {}

    // Player Action / Recommendation
    pushText('Player Action', obj.player_action);
    pushText('GTO Recommendation', obj.recommendation);

    // 移除 Summary 顯示（僅保留 GTO Recommendation 與其他必要區塊）

    return nodes.length ? nodes : null;
  };

  const renderFromLabeledString = (text: string) => {
    if (!text) {return null;}

    // 將文本切成區塊
    const labels = ['Rating', 'Rating & Summary', 'Player Action', 'GTO Recommendation', 'GTO Frequencies'];
    // 支援多種別名：Overall / Action / Recommendation / (Betting) Frequencies
    const labelRegex = /^(Overall|Rating(?:\s*&\s*Summary)?|Player Action|Action|GTO Recommendation|Recommendation|GTO Frequencies|Frequencies|Frequency|Betting Frequencies)\s*:\s*(.*)$/i;

    type Block = { key: string; content: string[] };
    const blocks: Record<string, Block> = {};
    let currentKey: string | null = null;

    // 文本正規化：合併換行分裂的標籤
    let normalized = text
      .replace(/GTO\s*\n\s*Recommendation\s*:/gi, 'GTO Recommendation:')
      .replace(/Player\s*\n\s*Action\s*:/gi, 'Player Action:')
      .replace(/Rating\s*&\s*\n\s*Summary\s*:/gi, 'Rating & Summary:')
      .replace(/Betting\s*\n\s*Frequencies\s*:/gi, 'GTO Frequencies:')
      .replace(/GTO\s*\n\s*Frequencies\s*:/gi, 'GTO Frequencies:');

    // 先處理明顯的 Overall 行（如 "Overall: ⭐⭐⭐⭐ ..."）
    const overallMatch = normalized.match(/^Overall\s*:\s*([⭐\s]+)([\s\S]*)$/i);
    if (overallMatch) {
      const stars = (overallMatch[1] || '').trim();
      const rest = (overallMatch[2] || '').trim();
      if (stars) {
        blocks.rating = { key: 'rating', content: [stars] };
      }
      if (rest) {
        blocks.summary = { key: 'summary', content: [rest] };
      }
    }

    // 先進行全局掃描（比逐行更穩定）
    const inlineRe = /(Overall|Rating\s*&\s*Summary|Rating|Player Action|Action|GTO Recommendation|Recommendation|GTO Frequencies|Frequencies|Frequency|Betting Frequencies)\s*:/gi;
    const matches: Array<{ key: string; start: number }> = [];
    let mm: RegExpExecArray | null;
    while ((mm = inlineRe.exec(normalized)) !== null) {
      let k = mm[1].toLowerCase();
      if (k === 'action') {k = 'player action';}
      if (k === 'recommendation') {k = 'gto recommendation';}
      if (k === 'gto frequencies' || k === 'frequency' || k === 'betting frequencies') {k = 'frequencies';}
      if (k === 'overall') {k = 'rating & summary';}
      matches.push({ key: k, start: mm.index });
    }
    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].start;
        const end = i + 1 < matches.length ? matches[i + 1].start : normalized.length;
        const key = matches[i].key;
        const seg = normalized.slice(start, end);
        const content = seg.replace(/^(?:[\s\S]*?)\s*:\s*/i, '');
        blocks[key] = { key, content: [content.trim()] };
      }
    }

    // 再逐行補漏
    const rawLines = normalized.split(/\r?\n/);
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const m = line.match(labelRegex);
      if (m) {
        let key = m[1].toLowerCase();
        // 別名標籤正規化
        if (key === 'action') {key = 'player action';}
        if (key === 'recommendation') {key = 'gto recommendation';}
        if (key === 'gto frequencies' || key === 'frequency' || key === 'betting frequencies') {key = 'frequencies';}
        if (key === 'overall') {key = 'rating & summary';}
        currentKey = key;
        const firstLine = m[2]?.trim() ? [m[2].trim()] : [];
        if (!blocks[key]) {blocks[key] = { key, content: [] };}
        blocks[key].content.push(...firstLine);
      } else if (currentKey) {
        blocks[currentKey].content.push(line);
      }
    }

    if (Object.keys(blocks).length === 0) {
      return renderFormattedAnalysis(normalized);
    }

    const order = ['rating', 'rating & summary', 'frequencies', 'player action', 'gto recommendation', 'summary'];
    const nodes: React.ReactNode[] = [];

    const normalizeFrequencies = (s: string) => {
      // 把內嵌的 " - " 轉成換行條列
      return s.replace(/\s*-\s+/g, '\n- ');
    };

    const pushBlock = (title: string, key: string) => {
      const b = blocks[key];
      if (!b || !b.content.join('\n').trim()) {return;}
      nodes.push(
        <Text key={`h-${key}`} style={[styles.analysisSubTitle, { marginTop: nodes.length ? theme.spacing.md : 0 }]}>
          {title}
        </Text>
      );

      let contentText = b.content.join('\n').trim();
      if (key === 'frequencies') {
        contentText = normalizeFrequencies(contentText);
      }
      // 若為頻率條列，行內本來就有 "- Key: xx%"，沿用通用渲染
      nodes.push(
        <View key={`c-${key}`}>
          {renderFormattedAnalysis(contentText)}
        </View>
      );
    };

    for (const k of order) {
      if (k === 'rating') {
        // Rating 或 Rating & Summary 任一存在都優先顯示
        if (blocks.rating) {pushBlock('Rating', 'rating');}
        else if (blocks['rating & summary']) {pushBlock('Rating', 'rating & summary');}
        continue;
      }
      if (k === 'rating & summary') {continue;} // 已處理
      if (k === 'player action') {pushBlock('Player Action', 'player action');}
      if (k === 'gto recommendation') {pushBlock('GTO Recommendation', 'gto recommendation');}
      // 跳過 frequencies 文字渲染，因為已經有頻率圖表了
      // if (k === 'frequencies') {pushBlock('GTO Frequencies', 'frequencies');}
      // 移除 Summary 區塊渲染
    }

    return nodes;
  };

  // 通用的行級格式渲染
  const renderFormattedAnalysis = (text: string) => {
    if (!text) {return null;}

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // // 跳過頻率相關的文字行（如 "Bet 75%: 60%", "Check: 40%" 等），只保留視覺化的頻率圖表
      // // 這樣可以避免重複顯示頻率信息
      // if (/^(Call|Check|Fold|Raise|Bet|All[- ]?in|Overbet)\s*(\d+[xX%]?)?\s*:\s*\d+%/.test(trimmedLine)) {
      //   return; // 跳過這行
      // }

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
        <Text style={styles.loadingText}>Analyzing your hand...</Text>
        <Text style={styles.loadingSubText}>{loadingMessage}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(loadingProgress)}%</Text>
        </View>
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
              : 'You\'ve used your 3 free AI Solver analyses for this week. Upgrade to Premium for unlimited analysis.'}
          </Text>

          {!quotaInfo.isPremium && (
            <TouchableOpacity
              style={styles.upgradeToPremiumButton}
              onPress={() => navigation.navigate('Settings', { screen: 'Subscription' })}
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
            <Text style={styles.summaryValue}>{renderColoredCardsText(currentHand.holeCards)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Board:</Text>
            <Text style={styles.summaryValue}>{renderColoredCardsText(currentHand.board)}</Text>
          </View>
        </View>

        {/* AI Solver Result */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisCardTitle}>AI Solver Result</Text>
          <View style={styles.analysisContent}>
            {sections ? (
              <>
                {activeTab === 'preflop' && renderStructuredAnalysis(sections.preflop)}
                {activeTab === 'flop' && renderStructuredAnalysis(sections.flop)}
                {activeTab === 'turn' && renderStructuredAnalysis(sections.turn)}
                {activeTab === 'river' && renderStructuredAnalysis(sections.river)}
              </>
            ) : (
              analysis ? renderStructuredAnalysis(analysis) : (
                <Text style={styles.analysisText}>Analysis is being generated...</Text>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      {sections && (
        <View style={[styles.bottomTabBarContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          <View style={styles.bottomTabBar}>
            {(
              [
                { key: 'preflop', label: 'PF' },
                { key: 'flop', label: 'F' },
                { key: 'turn', label: 'T' },
                { key: 'river', label: 'R' },
              ] as const
            ).map((t) => {
              const val: any = (sections as any)[t.key];
              const disabled = !(typeof val === 'string' ? val.trim() : val);
              const isActive = activeTab === (t.key as any);
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabItem, styles.tabItemFixed, isActive && styles.tabItemActive, disabled && styles.tabItemDisabled]}
                  onPress={() => !disabled && setActiveTab(t.key as any)}
                  disabled={disabled}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.tabText, isActive && styles.tabTextActive, disabled && styles.tabTextDisabled]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  progressContainer: {
    width: '80%',
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.inputBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
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
  bottomTabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    zIndex: 10,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
    justifyContent: 'space-between',
  },
  tabItem: {
    height: 44,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabItemFixed: {
    flex: 1,
    minWidth: 0,
  },
  tabItemActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  tabItemDisabled: {
    opacity: 0.35,
  },
  tabText: {
    color: '#E5E7EB',
    fontSize: theme.font.size.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextDisabled: {
    color: '#9CA3AF',
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
