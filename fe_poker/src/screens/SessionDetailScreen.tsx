import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import RevenueCatService from '../services/RevenueCatService';
import { Input } from '../components/Input';
import { CustomDateTimePicker } from '../components/DateTimePicker';

export const SessionDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const { sessions, hands, fetchSessions, fetchHands, deleteHand, toggleFavorite, endSession } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const [, setIsPremium] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [cashOutTime, setCashOutTime] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchSessions(), fetchHands()]);
      } catch (error) {
        console.error('Error loading session detail data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchSessions, fetchHands]);

  // 每次進入頁面時檢查訂閱狀態並刷新數據
  useFocusEffect(
    useCallback(() => {
      const checkSubscriptionAndRefreshData = async () => {
        console.log('🔄 SessionDetailScreen useFocusEffect triggered');
        const premium = await RevenueCatService.isPremiumUser();
        setIsPremium(premium);
        // 刷新 hands 數據以確保顯示最新的 hands
        console.log('🔄 About to call fetchHands from SessionDetail useFocusEffect');
        await fetchHands();
        console.log('✅ fetchHands completed from SessionDetail useFocusEffect');
      };
      checkSubscriptionAndRefreshData();
    }, [fetchHands])
  );


  const session = sessions.find(s => s.id === sessionId);
  const sessionHands = hands.filter(hand => hand.sessionId === sessionId);

  // 當 session 數據加載完成後，初始化 cashOut 相關的狀態
  useEffect(() => {
    if (session && !loading) {
      // 如果 session 已經有 cashOut 數據，使用這些數據初始化狀態
      if (session.cashOut !== undefined && session.cashOut !== null) {
        setCashOutAmount(session.cashOut.toString());
      }
      if (session.cashOutTime) {
        setCashOutTime(session.cashOutTime);
      }
    }
  }, [session, loading]);

  // Validation function for cash out
  const isValidCashOut = () => {
    if (!cashOutAmount || cashOutAmount.trim() === '') {
      return false;
    }
    const amount = parseFloat(cashOutAmount);
    return !isNaN(amount) && amount >= 0;
  };

  // Handle back navigation with validation
  const handleBackNavigation = () => {
    // Check if session has been ended (has cashOut value)
    if (session && session.cashOut === undefined) {
      // Session not ended, check if cash out amount is valid
      if (!isValidCashOut()) {
        Alert.alert(
          'Cash Out Required',
          'Please enter a valid cash out amount (≥ 0) before going back.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
        return;
      }
    }

    // Proceed with navigation
    if (navigation.canGoBack()) {
      const state = navigation.getState();
      // Check if SessionsList is in the stack
      const sessionListIndex = state.routes.findIndex(route => route.name === 'SessionsList');
      if (sessionListIndex !== -1 && sessionListIndex < state.index) {
        // Pop to SessionsList
        navigation.pop(state.index - sessionListIndex);
      } else {
        // Navigate to SessionsList
        navigation.navigate('SessionsList');
      }
    } else {
      navigation.navigate('SessionsList');
    }
  };

  // 動態設置標題和返回按鈕
  useLayoutEffect(() => {
    if (session) {
      navigation.setOptions({
        title: 'Sessions',
        headerLeft: () => (
          <TouchableOpacity
            onPress={handleBackNavigation}
            style={styles.headerBackButton}
          >
            <Text style={styles.headerBackButtonText}>‹ Back</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleEndSession} style={styles.headerEndButton}>
            <Text style={styles.headerEndButtonText}>End</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, session]);

  // Sort hands by date (newest first)
  const getSortedHands = () => {
    let filtered = [...sessionHands];

    // Sort by date, newest first
    filtered.sort((a, b) => {
      const comparison = new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
      return -comparison; // desc order (newest first)
    });

    return filtered;
  };

  const sortedHands = getSortedHands();

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this hand record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteHand(id) },
      ]
    );
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      console.log('=== FAVORITE BUTTON CLICKED ===');
      console.log('Toggling favorite for hand:', id);
      const newFavoriteStatus = await toggleFavorite(id);
      console.log('Toggle successful, new status:', newFavoriteStatus);
    } catch (error) {
      console.error('Toggle favorite error:', error);
      Alert.alert('Error', `Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddButtonPress = async () => {
    try {
      // 檢查手牌數量限制（免費用戶最多10手牌）
      const premium = await RevenueCatService.isPremiumUser();
      if (!premium && hands.length >= 10) {
        Alert.alert(
          'Upgrade Required',
          'You have reached the free limit of 10 hands. Please upgrade to Premium to add more hands.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              style: 'default',
              onPress: () => navigation.navigate('Subscription'),
            },
          ]
        );
        return;
      }

      // Navigate to RecordHand with the current sessionId
      navigation.navigate('RecordHand', { sessionId });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      // 如果檢查失敗，還是允許進入（避免阻止正常用戶）
      navigation.navigate('RecordHand', { sessionId });
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

  const handleEndSession = () => {
    // 如果 session 有保存的 cashOutTime，優先使用；如果沒有且當前狀態也沒有，才使用當前時間
    if (!cashOutTime && session && !session.cashOutTime) {
      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setCashOutTime(formattedDate);
    }
    // 不重置 cashOutAmount，保留用户之前的输入或数据库中的值
    setShowEndSessionModal(true);
  };

  const handleConfirmEndSession = async () => {
    // 驗證 cash out 金額
    if (!cashOutAmount || cashOutAmount.trim() === '') {
      Alert.alert('Cashout Amount Required', 'Please fill in cashout amount to end this session.');
      return;
    }

    const amount = parseFloat(cashOutAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cash out amount.');
      return;
    }

    // 驗證 cash out 時間不能早於 session 開始時間
    if (session && session.date && cashOutTime) {
      const sessionStartTime = new Date(session.date).getTime();
      const cashOutDateTime = new Date(cashOutTime.replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/, '$1-$2-$3T$4:$5')).getTime();

      if (cashOutDateTime < sessionStartTime) {
        Alert.alert(
          'Invalid Time',
          'Cash out time cannot be earlier than session start time.\n\nSession started: ' +
          session.date + '\nCash out time: ' + cashOutTime
        );
        return;
      }
    }

    try {
      // 調用 sessionStore 的 endSession 方法
      await endSession(sessionId, amount, cashOutTime);

      setShowEndSessionModal(false);
      // 返回到主 Sessions 頁面
      navigation.navigate('SessionsList');
    } catch (error) {
      console.error('Failed to end session:', error);
      Alert.alert('Error', 'Failed to end session');
    }
  };


  // Format time ago
  const getTimeAgo = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '') {return 'Unknown date';}

    const now = new Date();
    const handDate = new Date(dateStr);

    if (isNaN(handDate.getTime())) {return 'Invalid date';}

    const diffMs = now.getTime() - handDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  // Get BB amount
  const getBBAmount = (result: number, targetSessionId: string) => {
    const targetSession = sessions.find(s => s.id === targetSessionId);
    if (!targetSession || !targetSession.bigBlind) {return '';}
    const bbAmount = Math.round((result / targetSession.bigBlind) * 10) / 10;
    return `${bbAmount >= 0 ? '' : ''}${bbAmount} BB`;
  };

  // Render card icons
  const renderCardIcons = (holeCards: string | undefined) => {
    if (!holeCards) {return null;}

    let cards: string[] = [];

    if (holeCards.includes('♠') || holeCards.includes('♥') || holeCards.includes('♦') || holeCards.includes('♣')) {
      cards = holeCards.trim().split(/\s+/);
    } else {
      cards = holeCards.replace(/\s+/g, '').match(/.{2}/g) || [];
    }

    return (
      <View style={styles.cardContainer}>
        {cards.map((card, index) => {
          let rank: string;
          let suitSymbol: string;
          let isRed: boolean;

          if (card.length === 2 && /[cdhs]/.test(card[1])) {
            rank = card[0];
            const suit = card[1];
            suitSymbol = suit === 'c' ? '♣' : suit === 'd' ? '♦' : suit === 'h' ? '♥' : '♠';
            isRed = suit === 'd' || suit === 'h';
          } else {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      {/* Session Info */}
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle}>{session.location || 'Untitled Session'}</Text>
        <Text style={styles.sessionSubtitle}>
          ${session.smallBlind}/${session.bigBlind} • {sortedHands.length} hand{sortedHands.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Usage Hint */}
      {sortedHands.length > 0 && (
        <Text style={styles.usageHint}>Tap to view • Long press for more actions</Text>
      )}

      {/* Hands List */}
      <ScrollView
        style={styles.handsContainer}
      >
        {sortedHands.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No hands in this session</Text>
            <TouchableOpacity
              style={styles.addHandButton}
              onPress={handleAddButtonPress}
            >
              <Text style={styles.addHandButtonText}>Add First Hand</Text>
            </TouchableOpacity>
          </View>
        )}

        {sortedHands.map((hand) => {
          const timeAgo = getTimeAgo(hand.date || '');
          const bbAmount = getBBAmount(hand.result, hand.sessionId);

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
                  {hand.result >= 0 ? '+' : ''}${hand.result.toFixed(2)}
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

      {/* Floating Action Button - Fixed at bottom center */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleAddButtonPress}
      >
        <Text style={styles.fabButtonText}>+</Text>
      </TouchableOpacity>

      {/* End Session Modal */}
      <Modal
        visible={showEndSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.endSessionModal}>
            <SafeAreaView>
              <Text style={styles.modalTitle}>End Session</Text>

              <View style={styles.modalContent}>
                {/* Cash Out Amount */}
                <View style={styles.inputSection}>
                  <View style={styles.horizontalInputRow}>
                    <Text style={styles.leftLabel}>Cashout</Text>
                    <View style={styles.rightInputContainer}>
                      <Input
                        value={cashOutAmount}
                        onChangeText={(value) => {
                          // 只允許數字和小數點
                          const numericValue = value.replace(/[^0-9.]/g, '');
                          // 確保只有一個小數點
                          const parts = numericValue.split('.');
                          const validValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
                          setCashOutAmount(validValue);
                        }}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {/* Cash Out Time */}
                <View style={styles.inputSection}>
                  <CustomDateTimePicker
                    title="Time of Cashout"
                    value={cashOutTime}
                    onValueChange={setCashOutTime}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEndSessionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmEndSession}
                >
                  <Text style={styles.confirmButtonText}>End Session</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sessionInfo: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
  },
  sessionTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  sessionSubtitle: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: 4,
    textAlign: 'center',
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
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.gray,
    marginTop: theme.spacing.lg,
    fontSize: theme.font.size.body,
    marginBottom: theme.spacing.md,
  },
  addHandButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
  },
  addHandButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
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
  favoriteIndicator: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: theme.spacing.xs,
  },
  fallbackText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
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
  timeAgo: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: 4,
    textAlign: 'right',
  },
  fabButton: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 35,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.button,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  headerBackButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  headerBackButtonText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
  headerEndButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEndButtonText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },

  // End Session Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  endSessionModal: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  modalContent: {
    padding: theme.spacing.lg,
  },
  inputSection: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: theme.font.size.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 水平輸入行樣式
  horizontalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftLabel: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 0.3,
  },
  rightInputContainer: {
    flex: 0.65,
  },
});
