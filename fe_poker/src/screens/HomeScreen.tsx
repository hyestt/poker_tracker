import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import revenueCatService from '../services/RevenueCatService';

const filterOptions = [
  { key: 'all', label: 'All Hands' },
  { key: 'analyzed', label: 'Analyzed' },
  { key: 'favorites', label: 'Starred ⭐' },
  { key: 'recent', label: 'Recent' },
  { key: 'profitable', label: 'Profitable' },
  { key: 'losses', label: 'Losses' },
];

const sortOptions = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('🏠 [HomeScreen] Component mounted');
  const { sessions, hands, fetchSessions, fetchHands, deleteHand, analyzeHand, toggleFavorite } = useSessionStore();
  const isFocused = useIsFocused();
  console.log('🏠 [HomeScreen] Initial state - sessions:', sessions.length, 'hands:', hands.length);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPremium, setIsPremium] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    gtoRemaining: number;
    handRemaining: number;
    isPremium: boolean;
  } | null>(null);

  const [sessionFilter, setSessionFilter] = useState<{
    location?: string;
    dateTime?: string;
    timeRange?: string;
    position?: string;
    tag?: string;
    customStartDate?: string;
    customEndDate?: string;
  }>({});

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSessionFilter, setTempSessionFilter] = useState<{
    location?: string;
    dateTime?: string;
    timeRange?: string;
    position?: string;
    tag?: string;
    customStartDate?: string;
    customEndDate?: string;
  }>({});



  // 計算有實際手牌記錄的 sessions 數量
  const activeSessions = sessions.filter(session =>
    hands.some(hand => hand.sessionId === session.id)
  );

  useEffect(() => {
    console.log('🏠 [HomeScreen] Initial useEffect - fetching sessions and hands');
    fetchSessions();
    fetchHands();
  }, []);

  // 每次進入頁面時檢查訂閱狀態和刷新數據
  useFocusEffect(
    useCallback(() => {
      const checkSubscriptionAndRefreshData = async () => {
        console.log('🔄 HomeScreen useFocusEffect triggered');
        const premium = await revenueCatService.isPremiumUser();
        setIsPremium(premium);

        // Load quota information
        try {
          const gtoQuota = await revenueCatService.canUseGTOAnalysis();
          const handRemaining = premium ? -1 : Math.max(0, 10 - hands.length);
          setQuotaInfo({
            gtoRemaining: gtoQuota.remainingFree,
            handRemaining,
            isPremium: premium,
          });
        } catch (error) {
          console.error('Failed to load quota info:', error);
        }

        // 重新獲取最新的 hands 數據
        console.log('🔄 About to call fetchHands from useFocusEffect');
        await fetchHands();
        console.log('✅ fetchHands completed from useFocusEffect');
      };
      checkSubscriptionAndRefreshData();
    }, [fetchHands])
  );

  // 監聽 isFocused 變化，確保每次頁面獲得焦點時都刷新數據
  useEffect(() => {
    if (isFocused) {
      console.log('📱 HomeScreen gained focus, refreshing hands data');
      fetchHands();
    }
  }, [isFocused, fetchHands]);

  // Filter and sort hands
  const getFilteredHands = () => {
    let filtered = [...hands];

    // Session filter
    if (sessionFilter.location || sessionFilter.dateTime || sessionFilter.timeRange || sessionFilter.position || sessionFilter.tag || sessionFilter.customStartDate || sessionFilter.customEndDate) {
      filtered = filtered.filter(hand => {
        const session = sessions.find(s => s.id === hand.sessionId);
        if (!session) {return false;}

        // Location filter
        if (sessionFilter.location && session.location !== sessionFilter.location) {
          return false;
        }

        // Date & Time filter (session date)
        if (sessionFilter.dateTime && session.date !== sessionFilter.dateTime) {
          return false;
        }

        // Time Range filter
        if (sessionFilter.timeRange) {
          const now = new Date();
          const sessionDate = new Date(session.date || '');

          switch (sessionFilter.timeRange) {
            case '1day':
              const diffHours = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60));
              if (diffHours > 24) {return false;}
              break;
            case '3days':
              const diff3Days = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diff3Days > 3) {return false;}
              break;
            case '7days':
              const diff7Days = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diff7Days > 7) {return false;}
              break;
            case '30days':
              const diff30Days = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
              if (diff30Days > 30) {return false;}
              break;
            case 'custom':
              // Custom range filter
              if (sessionFilter.customStartDate || sessionFilter.customEndDate) {
                const sessionTime = sessionDate.getTime();

                if (sessionFilter.customStartDate) {
                  const startTime = new Date(sessionFilter.customStartDate).getTime();
                  if (sessionTime < startTime) {return false;}
                }

                if (sessionFilter.customEndDate) {
                  const endTime = new Date(sessionFilter.customEndDate).getTime();
                  if (sessionTime > endTime) {return false;}
                }
              }
              break;
          }
        }

        // Position filter
        if (sessionFilter.position && hand.position !== sessionFilter.position) {
          return false;
        }

        // Hand Tag filter
        if (sessionFilter.tag && (!hand.tags || !hand.tags.includes(sessionFilter.tag))) {
          return false;
        }

        return true;
      });
    }

    // Other filters
    switch (selectedFilter) {
      case 'analyzed':
        console.log('🔍 Applying analyzed filter. Total hands before filter:', filtered.length);
        const analyzedHands = filtered.filter(hand => {
          const hasAnalysis = hand.analysis && hand.analysis.trim() !== '';
          if (hasAnalysis) {
            console.log('✅ Found analyzed hand:', hand.id, hand.analysis?.substring(0, 50) + '...');
          }
          return hasAnalysis;
        });
        console.log('📊 Analyzed hands found:', analyzedHands.length);
        filtered = analyzedHands;
        break;
      case 'recent':
        filtered = filtered.slice(-10);
        break;
      case 'profitable':
        filtered = filtered.filter(hand => hand.result > 0);
        break;
      case 'losses':
        filtered = filtered.filter(hand => hand.result < 0);
        break;
      case 'favorites':
        filtered = filtered.filter(hand => hand.favorite);
        break;
      default:
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (selectedSort) {
        case 'date':
          comparison = new Date(a.updatedAt || a.createdAt || a.date || '').getTime() - new Date(b.updatedAt || b.createdAt || b.date || '').getTime();
          break;
        case 'amount':
          comparison = a.result - b.result;
          break;
        default:
          return 0;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const filteredHands = getFilteredHands();

  const handleDelete = (id: string) => {
    console.log('🗑️ [HomeScreen] Delete hand requested:', id);
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this hand record?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🗑️ [HomeScreen] Delete cancelled by user'),
        },
        {
          text: 'Delete',
          onPress: () => {
            console.log('🗑️ [HomeScreen] Delete confirmed, executing deleteHand:', id);
            deleteHand(id);
          },
        },
      ]
    );
  };

  const handleAnalyze = async (id: string) => {
    console.log('🤖 [HomeScreen] AI Analysis requested for hand:', id);
    try {
      console.log('🤖 [HomeScreen] Starting AI analysis...');
      const analysis = await analyzeHand(id);
      console.log('🤖 [HomeScreen] AI Analysis completed successfully, length:', analysis?.length || 0);
      Alert.alert('AI Analysis Result', analysis, [{ text: 'OK' }]);
    } catch (error) {
      console.error('🤖 [HomeScreen] AI Analysis failed:', error);
      Alert.alert('Analysis Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      console.log('=== FAVORITE BUTTON CLICKED ===');
      console.log('Toggling favorite for hand:', id);
      const newFavoriteStatus = await toggleFavorite(id);
      console.log('Toggle successful, new status:', newFavoriteStatus);
      // 成功時不顯示Alert，讓用戶體驗更流暢
      // UI會自動更新星號狀態
    } catch (error) {
      console.error('Toggle favorite error:', error);
      Alert.alert('Error', `Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddButtonPress = async () => {
    console.log('➕ [HomeScreen] Add button pressed, current hands count:', hands.length);
    try {
      // 檢查手牌數量限制（免費用戶最多10手牌）
      console.log('💎 [HomeScreen] Checking premium status...');
      const premium = await revenueCatService.isPremiumUser();
      console.log('💎 [HomeScreen] Premium status:', premium);

      if (!premium && hands.length >= 10) {
        console.warn('⚠️ [HomeScreen] Free user limit reached - 10 hands max');
        Alert.alert(
          'Upgrade Required',
          'You have reached the free limit of 10 hands. Please upgrade to Premium to add more hands.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              style: 'default',
              onPress: () => navigation.navigate('Settings', { screen: 'Subscription' }),
            },
          ]
        );
        return;
      }

      // 檢查是否有空的 session（沒有手牌的 session）
      const emptySessions = sessions.filter(session =>
        !hands.some(hand => hand.sessionId === session.id)
      );

      if (emptySessions.length > 0) {
        // 找到最近創建的空 session
        const mostRecentEmptySession = emptySessions.sort((a, b) =>
          new Date(b.createdAt || b.date || '').getTime() - new Date(a.createdAt || a.date || '').getTime()
        )[0];

        console.log('🔄 [HomeScreen] Found empty session, navigating to SessionDetail:', mostRecentEmptySession.id);
        navigation.navigate('SessionDetail', { sessionId: mostRecentEmptySession.id });
        return;
      }

      // 如果沒有空的 session，創建新的 session
      navigation.navigate('NewSession');
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // 如果檢查失敗，還是允許進入（避免阻止正常用戶）
      navigation.navigate('NewSession');
    }
  };

  const showHandActions = (handId: string) => {
    const hand = hands.find(h => h.id === handId);
    if (!hand) {return;}

    const actionButtons = [
      {
        text: hand.favorite ? 'Remove from Starred ⭐' : 'Add to Starred ⭐',
        onPress: () => handleToggleFavorite(handId),
      },
      {
        text: 'Edit Hand',
        onPress: () => navigation.navigate('EditHand', { handId }),
      },
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => handleDelete(handId),
      },
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
    ];

    Alert.alert(
      'Hand Actions',
      'What would you like to do with this hand?',
      actionButtons
    );
  };

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const showFilterOptions = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };


  // Format time ago
  const getTimeAgo = (dateStr: string) => {
    // Handle empty or invalid date strings
    if (!dateStr || dateStr.trim() === '') {
      return 'Unknown date';
    }

    const now = new Date();
    let handDate;

    // Handle different date formats from SQLite
    if (dateStr.includes('T') && dateStr.includes('Z')) {
      // ISO format: "2025-06-06T00:22:48.342Z"
      handDate = new Date(dateStr);
    } else if (dateStr.includes('T') && !dateStr.includes('Z')) {
      // ISO format without Z: "2025-06-06T00:22:48.342"
      handDate = new Date(dateStr + 'Z'); // Assume UTC
    } else if (dateStr.includes(' ')) {
      // SQLite DATETIME format: "2025-08-12 07:22:50"
      // Treat as UTC by appending 'Z' after converting to ISO format
      const isoString = dateStr.replace(' ', 'T') + 'Z';
      handDate = new Date(isoString);
    } else {
      // Fallback to standard Date parsing
      handDate = new Date(dateStr);
    }

    // Check if the date is valid
    if (isNaN(handDate.getTime())) {
      console.warn('Invalid date format:', dateStr);
      return 'Invalid date';
    }

    const diffMs = Math.abs(now.getTime() - handDate.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Debug log for all cases to troubleshoot
    console.log('getTimeAgo calculation:', {
      dateStr,
      now: now.toISOString(),
      handDate: handDate.toISOString(),
      diffMs,
      diffMins,
      diffHours,
      diffDays,
      result: diffMins < 60 ? `${diffMins} minutes ago` :
              diffHours < 24 ? `${diffHours} h ago` :
              `${diffDays} d ago`,
    });

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} h ago`;
    } else {
      return `${diffDays} d ago`;
    }
  };

  // Get BB amount
  const getBBAmount = (result: number, sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.bigBlind) {return '';}
    const bbAmount = Math.round((result / session.bigBlind) * 10) / 10;
    return `${bbAmount >= 0 ? '' : ''}${bbAmount} BB`;
  };

  // Render card icons
  const renderCardIcons = (holeCards: string | undefined) => {
    if (!holeCards) {return null;}

    // Parse cards - handle both formats: "AcKc" and "A♠ Q♠"
    let cards: string[] = [];

    if (holeCards.includes('♠') || holeCards.includes('♥') || holeCards.includes('♦') || holeCards.includes('♣')) {
      // New format with symbols: "A♠ Q♠"
      cards = holeCards.trim().split(/\s+/);
    } else {
      // Old format with letters: "AcKc"
      cards = holeCards.replace(/\s+/g, '').match(/.{2}/g) || [];
    }

    return (
      <View style={styles.cardContainer}>
        {cards.map((card, index) => {
          let rank: string;
          let suitSymbol: string;
          let isRed: boolean;

          if (card.length === 2 && /[cdhs]/.test(card[1])) {
            // Old format: "Ac", "Kh", etc.
            rank = card[0];
            const suit = card[1];
            suitSymbol = suit === 'c' ? '♣' : suit === 'd' ? '♦' : suit === 'h' ? '♥' : '♠';
            isRed = suit === 'd' || suit === 'h';
          } else {
            // New format: "A♠", "K♥", etc.
            rank = card.slice(0, -1);
            suitSymbol = card.slice(-1);
            isRed = suitSymbol === '♥' || suitSymbol === '♦';
          }

          return (
            <View key={index} style={[styles.cardIcon, isRed ? styles.redCard : styles.blackCard]}>
              <Text style={[styles.cardText, isRed ? styles.redCardText : styles.blackCardText]}>
                {rank}
              </Text>
              <Text style={[styles.suitText, isRed ? styles.redCardText : styles.blackCardText]}>
                {suitSymbol}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterRow}>
        <View style={styles.filterDropdownContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={showFilterOptions}>
            <Text style={styles.filterTitle}>
              {filterOptions.find(f => f.key === selectedFilter)?.label || 'All Hands'}
            </Text>
            <View style={styles.filterIcons}>
              <Text style={[styles.filterIcon, showFilterDropdown && styles.filterIconRotated]}>▼</Text>
            </View>
          </TouchableOpacity>

          {showFilterDropdown && (
            <View style={styles.filterDropdown}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterDropdownItem,
                    selectedFilter === option.key && styles.selectedFilterDropdownItem,
                  ]}
                  onPress={() => {
                    setSelectedFilter(option.key);
                    setShowFilterDropdown(false);
                  }}
                >
                  <View style={styles.filterDropdownTextContainer}>
                    <Text style={[
                      styles.filterDropdownText,
                      selectedFilter === option.key && styles.selectedFilterDropdownText,
                    ]}>
                      {option.key === 'favorites' ? 'Starred' :
                       option.key === 'analyzed' ? 'Analyzed' : option.label}
                    </Text>
                    {option.key === 'favorites' && (
                      <Text style={[
                        styles.filterDropdownStar,
                        selectedFilter === option.key && styles.selectedFilterDropdownText,
                      ]}>
                        ⭐
                      </Text>
                    )}
                    {option.key === 'analyzed' && (
                      <Text style={[
                        styles.filterDropdownStar,
                        selectedFilter === option.key && styles.selectedFilterDropdownText,
                      ]}>
                        📊
                      </Text>
                    )}
                  </View>
                  {selectedFilter === option.key && (
                    <Text style={styles.filterCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.sessionFilterButton}
          onPress={() => {
            setTempSessionFilter(sessionFilter);
            setShowFilterModal(true);
          }}
        >
          <Text style={styles.sessionFilterText}>
            {(() => {
              const activeFilters = [
                sessionFilter.location,
                sessionFilter.dateTime,
                sessionFilter.timeRange,
                sessionFilter.position,
                sessionFilter.tag,
                sessionFilter.customStartDate,
                sessionFilter.customEndDate,
              ].filter(Boolean).length;

              return activeFilters > 0 ? `☰ Filter (${activeFilters})` : '☰ Filter';
            })()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {sortOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortOption,
              selectedSort === option.key && styles.selectedSortOption,
            ]}
            onPress={() => {
              if (selectedSort === option.key) {
                setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
              } else {
                setSelectedSort(option.key);
                setSortDirection('desc');
              }
            }}
          >
            <Text style={[
              styles.sortOptionText,
              selectedSort === option.key && styles.selectedSortOptionText,
            ]}>
              {option.label} {selectedSort === option.key ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quota Status */}
      {quotaInfo && !quotaInfo.isPremium && (
        <View style={styles.quotaContainer}>
          <View style={styles.quotaItem}>
            <Text style={styles.quotaLabel}>AI Solver:</Text>
            <Text style={[styles.quotaValue, quotaInfo.gtoRemaining === 0 && styles.quotaExhausted]}>
              {quotaInfo.gtoRemaining === -1 ? '∞' : quotaInfo.gtoRemaining} left this week
            </Text>
          </View>
          <View style={styles.quotaItem}>
            <Text style={styles.quotaLabel}>Hand Creation:</Text>
            <Text style={[styles.quotaValue, quotaInfo.handRemaining === 0 && styles.quotaExhausted]}>
              {quotaInfo.handRemaining === -1 ? '∞' : quotaInfo.handRemaining} left total
            </Text>
          </View>
        </View>
      )}

      {/* Usage Hint */}
      {filteredHands.length > 0 && (
        <Text style={styles.usageHint}>Tap to view • Long press for more actions</Text>
      )}

      {/* Hands List */}
      <ScrollView
        style={styles.handsContainer}
      >
        {filteredHands.length === 0 && (
          <Text style={styles.empty}>No hands found</Text>
        )}


        {filteredHands.map((hand) => {
          const timeString = hand.updatedAt || hand.createdAt || hand.date || '';
          // Debug: log the actual time string being passed
          if (hand.id.includes('cc92448d') || hand.position === 'BTN') {
            console.log('DEBUG TIME:', {
              handId: hand.id.substring(0, 8),
              position: hand.position,
              updatedAt: hand.updatedAt,
              createdAt: hand.createdAt,
              date: hand.date,
              timeString,
              now: new Date().toISOString(),
            });
          }
          const timeAgo = getTimeAgo(timeString);
          const bbAmount = getBBAmount(hand.result, hand.sessionId);

          // Debug favorite status
          if (hand.id === '2c7efa16-c7bd-41ee-bda5-5825feb73822') {
            console.log('DEBUG rendering hand:', hand.id, 'favorite:', hand.favorite, 'type:', typeof hand.favorite);
          }


          return (
            <TouchableOpacity
              key={hand.id}
              style={styles.handItem}
              onPress={() => navigation.navigate('HandDetail', { handId: hand.id })}
              onLongPress={() => showHandActions(hand.id)}
            >
              {/* Left: Card Icons */}
              <View style={styles.leftSection}>
                {renderCardIcons(hand.holeCards)}
              </View>

              {/* Middle: Position + Analysis */}
              <View style={styles.middleSection}>
                <View style={styles.positionRow}>
                  {hand.position && (
                    <Text style={styles.positionText}>{hand.position}</Text>
                  )}
                  {hand.favorite && (
                    <Text style={styles.favoriteIndicator}>⭐</Text>
                  )}
                  {hand.analysis && hand.analysis.trim() !== '' && (
                    <Text style={styles.analysisIndicator}>📊</Text>
                  )}
                </View>
                {hand.details && !hand.position && (
                  <Text style={styles.fallbackText}>{hand.details.slice(0, 20)}</Text>
                )}
              </View>

              {/* Right: Amount & BB & Time */}
              <View style={styles.rightSection}>
                <Text style={[
                  styles.amount,
                  { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss },
                ]}>
                  ${Math.abs(hand.result).toFixed(2)}
                </Text>
                {bbAmount && (
                  <Text style={[
                    styles.bbAmount,
                    { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss },
                  ]}>
                    {bbAmount}
                  </Text>
                )}
                <Text style={styles.timeAgo}>{timeAgo}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      {/* iOS Style Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.filterModal}>
            <Text style={styles.modalTitle}>Advanced Filter</Text>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

              {/* Time Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time Range</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                                             const options = [
                         { key: '', label: 'All Time' },
                         { key: '1day', label: 'Last 24 Hours' },
                         { key: '3days', label: 'Last 3 Days' },
                         { key: '7days', label: 'Last 7 Days' },
                         { key: '30days', label: 'Last 30 Days' },
                       ];

                      Alert.alert(
                        'Select Time Range',
                        '',
                        options.map(option => ({
                          text: option.label,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev,
                              timeRange: option.key || undefined,
                              customStartDate: undefined,
                              customEndDate: undefined,
                            }));
                          },
                        })).concat([{ text: 'Cancel', onPress: () => {} }])
                      );
                    }}
                  >
                                         <Text style={styles.dropdownText}>
                       {tempSessionFilter.timeRange
                         ? (['', '1day', '3days', '7days', '30days'].includes(tempSessionFilter.timeRange)
                           ? ['All Time', 'Last 24 Hours', 'Last 3 Days', 'Last 7 Days', 'Last 30 Days'][['', '1day', '3days', '7days', '30days'].indexOf(tempSessionFilter.timeRange)]
                           : tempSessionFilter.timeRange)
                         : 'All Time'
                       }
                     </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Position Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Position</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      const positions = ['All Positions', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

                      Alert.alert(
                        'Select Position',
                        '',
                        positions.map(position => ({
                          text: position,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev,
                              position: position === 'All Positions' ? undefined : position,
                            }));
                          },
                        })).concat([{ text: 'Cancel', onPress: () => {} }])
                      );
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {tempSessionFilter.position || 'All Positions'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hand Tag Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Hand Tag</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      // 從所有hands中收集唯一的tags
                      const allUsedTags = hands.reduce((tags: Set<string>, hand) => {
                        if (hand.tags && Array.isArray(hand.tags)) {
                          hand.tags.forEach(tag => {
                            if (tag && tag.trim()) {
                              tags.add(tag.trim());
                            }
                          });
                        }
                        return tags;
                      }, new Set<string>());

                      const tags = [
                        { key: '', name: 'All Tags' },
                        ...Array.from(allUsedTags).sort().map(tag => ({ key: tag, name: tag })),
                      ];

                      Alert.alert(
                        'Select Hand Tag',
                        '',
                        tags.map(tag => ({
                          text: tag.name,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev,
                              tag: tag.key || undefined,
                            }));
                          },
                        })).concat([{ text: 'Cancel', onPress: () => {} }])
                      );
                    }}
                  >
                    <View style={styles.dropdownContent}>
                      <Text style={styles.dropdownText}>
                        {tempSessionFilter.tag || 'All Tags'}
                      </Text>
                    </View>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      const locations = ['All Locations', 'Home Game', 'Casino', 'Online', 'Club', 'Tournament', 'Cash Game'].concat(
                        [...new Set(sessions.map(s => s.location).filter(loc =>
                          loc && !['Home Game', 'Casino', 'Online', 'Club', 'Tournament', 'Cash Game'].includes(loc)
                        ))]
                      );

                      Alert.alert(
                        'Select Location',
                        '',
                        locations.map(location => ({
                          text: location,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev,
                              location: location === 'All Locations' ? undefined : location,
                            }));
                          },
                        })).concat([{ text: 'Cancel', onPress: () => {} }])
                      );
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {tempSessionFilter.location || 'All Locations'}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>





            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setTempSessionFilter({})}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setSessionFilter(tempSessionFilter);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 60,
    marginBottom: theme.spacing.sm,
    zIndex: 9998,
  },
  filterDropdownContainer: {
    position: 'relative',
    zIndex: 9999,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    minWidth: 120,
  },
  dateRangeButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
    marginLeft: theme.spacing.sm,
  },
  dateRangeText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  sessionFilterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
    marginLeft: theme.spacing.sm,
  },
  sessionFilterText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  filterTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '700',
    color: theme.colors.text,
  },
  filterIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  filterIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    marginTop: theme.spacing.xs,
    zIndex: 10000,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedFilterDropdownItem: {
    backgroundColor: theme.colors.primary + '10',
  },
  filterDropdownTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterDropdownText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: theme.font.size.body * 1.2,
    textAlignVertical: 'center',
  },
  filterDropdownStar: {
    fontSize: theme.font.size.body,
    marginLeft: 4,
  },
  selectedFilterDropdownText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filterCheckmark: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sortOption: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
  },
  selectedSortOption: {
    backgroundColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  selectedSortOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateRangeDisplay: {
    textAlign: 'center',
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontWeight: '600',
  },
  usageHint: {
    textAlign: 'center',
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontStyle: 'italic',
  },
  handsContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  handItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
  },
  leftSection: {
    marginRight: theme.spacing.sm,
  },
  cardsAndTimeContainer: {
    alignItems: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  cardIcon: {
    width: 30,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  redCard: {
    borderColor: '#ff4444',
  },
  blackCard: {
    borderColor: '#333',
  },
  cardText: {
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  suitText: {
    fontSize: 10,
    lineHeight: 12,
  },
  redCardText: {
    color: '#ff4444',
  },
  blackCardText: {
    color: '#333',
  },
  middleSection: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  handTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  positionText: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  fallbackText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
  },
  handTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  timeAgo: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: 4,
    textAlign: 'right',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
  },
  bbAmount: {
    fontSize: theme.font.size.small,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.gray,
    marginTop: theme.spacing.lg,
    fontSize: theme.font.size.body,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModal: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.card,
    borderTopRightRadius: theme.radius.card,
    padding: theme.spacing.lg,
    height: '85%',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterSectionTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.input,
    padding: theme.spacing.sm,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  dropdownText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  dropdownArrow: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  clearButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    borderWidth: 1,
    borderColor: theme.colors.gray,
    alignItems: 'center',
    minHeight: 50,
  },
  clearButtonText: {
    color: theme.colors.gray,
    fontSize: theme.font.size.body,
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    minHeight: 50,
  },
  applyButtonText: {
    color: 'white',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
    marginLeft: theme.spacing.xs,
    backgroundColor: 'transparent',
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 18,
  },
  favoriteActive: {
    color: '#FFD700',
  },
  favoriteInactive: {
    color: '#999999',
  },
  favoriteIndicator: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: theme.spacing.xs,
  },
  analysisIndicator: {
    fontSize: 16,
    marginLeft: theme.spacing.xs,
  },
  tagOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagColorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.sm,
  },
  customDateContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dateRangeRow: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  dateButton: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateButtonLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginBottom: 4,
  },
  dateButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  comingSoonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: theme.spacing.md,
  },
  quotaContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quotaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  quotaLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '500',
  },
  quotaValue: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  quotaExhausted: {
    color: theme.colors.loss,
  },
});
