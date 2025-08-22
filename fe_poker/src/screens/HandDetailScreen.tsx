import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Hand, Session, Villain } from '../models';
import { formatDate } from '../utils/dateFormat';
import { generateShareText } from '../utils/handTextGenerator';
import revenueCatService from '../services/RevenueCatService';

export const HandDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { handId, sessionId: routeSessionId, initialHand } = route.params || {};
  const { getHand, getSession } = useSessionStore();
  const [hand, setHand] = useState<Hand | null>(initialHand ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [gtoQuotaInfo, setGtoQuotaInfo] = useState<{canUse: boolean; isPremium: boolean; remainingFree: number; needsPremium: boolean} | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        try {
          // 先顯示初始 hand（如果有），避免白屏
          if (!initialHand) {
            setLoading(true);
          }

          const handData = await getHand(handId);
          const sessionData = await getSession(handData.sessionId);
          if (!isMounted) {return;}
          setHand(handData);
          setSession(sessionData);

          // 非阻塞檢查 GTO 配額
          revenueCatService.canUseGTOAnalysis()
            .then(q => isMounted && setGtoQuotaInfo(q))
            .catch(() => {});
        } catch (error) {
          console.error('Failed to load hand/session:', error);
          Alert.alert('Error', 'Failed to load hand details');
        } finally {
          if (isMounted) {setLoading(false);}
        }
      };

      loadData();
      return () => { isMounted = false; };
    }, [handId, getHand, getSession, initialHand])
  );

  // 進入詳情頁時隱藏 TabBar，離開時恢復預設樣式
  useFocusEffect(
    useCallback(() => {
      const parent = navigation?.getParent?.();
      if (!parent) {return;}
      const defaultTabBarStyle = { backgroundColor: '#2D3748', borderTopColor: '#4A5568' } as const;
      parent.setOptions({ tabBarStyle: { ...defaultTabBarStyle, display: 'none' } });

      const unsubscribeTransition = navigation.addListener('transitionEnd', () => {
        parent.setOptions({ tabBarStyle: { ...defaultTabBarStyle, display: 'none' } });
      });

      return () => {
        unsubscribeTransition?.();
        parent.setOptions({ tabBarStyle: defaultTabBarStyle });
      };
    }, [navigation])
  );

  const handleEdit = useCallback(() => {
    navigation.navigate('EditHand', { handId });
  }, [navigation, handId]);

  const handleBack = useCallback(() => {
    // 如果有 routeSessionId，說明是從 RecordHand 導航過來的，應該回到 SessionDetail
    if (routeSessionId) {
      navigation.navigate('SessionDetail', { sessionId: routeSessionId });
    } else {
      // 否則使用標準的返回行為
      navigation.goBack();
    }
  }, [navigation, routeSessionId]);

  // 設置導航列按鈕
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={styles.navBackButton}>
          <Text style={styles.navBackButtonText}>‹ Back</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleEdit} style={styles.navEditButton}>
          <Text style={styles.navEditButtonText}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleEdit, handleBack]);
  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
  };

  const renderCards = (cards: string, isBoard = false) => {
    if (!cards) {return null;}

    const cardArray = cards.split(' ');

    return (
      <View style={styles.cardsContainer}>
        {cardArray.map((card, index) => {
          const rank = card.slice(0, -1);
          const suit = card.slice(-1);

          let label = '';
          if (isBoard) {
            if (index === 1) {label = 'Flop';} // 在第2張牌上顯示Flop（3張牌的中間）
            else if (index === 3) {label = 'Turn';} // 在第4張牌上顯示Turn
            else if (index === 4) {label = 'River';} // 在第5張牌上顯示River
          }

          return (
            <View key={index} style={styles.cardWrapper}>
              {/* Add labels for board cards */}
              <Text style={[styles.boardLabel, !label && styles.boardLabelEmpty]}>
                {isBoard ? label : ''}
              </Text>

              <View style={styles.card}>
                <Text style={[styles.cardText, { color: getSuitColor(suit) }]}>
                  {rank}{suit}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderVillain = (villain: Villain, index: number) => (
    <View key={villain.id} style={styles.villainContainer}>
      <Text style={styles.villainTitle}>Villain {index + 1}</Text>
      <View style={styles.heroSingleRow}>
        <View style={styles.heroItem}>
          <Text style={styles.infoLabel}>Position:</Text>
          <Text style={styles.infoValue}>{villain.position || 'Unknown'}</Text>
        </View>
        <View style={styles.heroItem}>
          <Text style={styles.infoLabel}>Cards:</Text>
          <View style={styles.inlineCardsContainer}>
            {villain.holeCards ? renderCards(villain.holeCards) : <Text style={styles.infoValue}>Unknown</Text>}
          </View>
        </View>
      </View>
    </View>
  );

  const generateShareTextLocal = () => {
    if (!hand || !session) {return '';}
    return generateShareText(hand, session);
  };

  const handleShare = async () => {
    try {
      const shareText = generateShareTextLocal();
      await Share.share({
        message: shareText,
        title: 'Poker Hand Details',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share hand details');
    }
  };

  // edit moved to headerRight

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading hand details...</Text>
      </View>
    );
  }

  if (!hand || !session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Hand not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: theme.spacing.xl * 3 },
        ]}
      >
        {/* Hero Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hero</Text>
          <View style={styles.heroSingleRow}>
            <View style={styles.heroItem}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{hand.position || 'Unknown'}</Text>
            </View>
            <View style={styles.heroItem}>
              <Text style={styles.infoLabel}>Hole Cards:</Text>
              <View style={styles.inlineCardsContainer}>
                {hand.holeCards ? renderCards(hand.holeCards) : <Text style={styles.infoValue}>Unknown</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* Board */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Board</Text>
          <View style={styles.boardContainer}>
            {hand.board ? renderCards(hand.board, true) : <Text style={styles.noDataText}>No flop shown</Text>}
          </View>
        </View>

        {/* Hand Details - 移到 Board 下方 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hand Details</Text>
          <Text style={styles.detailsText}>{hand.details || 'No details provided'}</Text>
        </View>

        {/* Villains */}
        {hand.villains && hand.villains.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Villains</Text>
            {hand.villains.map((villain, index) => renderVillain(villain, index))}
          </View>
        )}

        {/* Tags */}
        {hand.tags && hand.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {hand.tags.map((tag, index) => {
                const getTagColor = (idx: number) => {
                  const colors = ['#FF69B4', '#4169E1', '#32CD32']; // 粉紅色、藍色、綠色
                  return colors[idx] || theme.colors.primary;
                };

                return (
                  <View key={index} style={[styles.tag, { backgroundColor: getTagColor(index) }]}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Note */}
        {hand.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note</Text>
            <Text style={styles.noteText}>{hand.note}</Text>
          </View>
        )}

        {/* Result */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Result</Text>
          <Text style={[
            styles.resultText,
            { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss },
          ]}>
            {hand.result >= 0 ? '+' : ''}${hand.result}
          </Text>
          {session && (
            <Text style={styles.bbText}>
              ({hand.result >= 0 ? '+' : ''}{(hand.result / session.bigBlind).toFixed(1)} BB)
            </Text>
          )}
        </View>



        {/* Session Information - 移到最後 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{session.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formatDate(session.date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Small Blind:</Text>
              <Text style={styles.infoValue}>${session.smallBlind}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Big Blind:</Text>
              <Text style={styles.infoValue}>${session.bigBlind}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Buy-In:</Text>
              <Text style={styles.infoValue}>${session.buyIn}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Table Size:</Text>
              <Text style={styles.infoValue}>{session.tableSize || 6}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={handleShare} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (gtoQuotaInfo && !gtoQuotaInfo.canUse && !hand?.analysis) {
              Alert.alert(
                'AI Solver Limit Reached',
                gtoQuotaInfo.isPremium
                  ? 'You\'ve reached your analysis limit for today. Please try again tomorrow.'
                  : 'You\'ve used your 3 free AI Solver analyses for this week. Upgrade to Premium for unlimited analysis.',
                gtoQuotaInfo.isPremium
                  ? [{ text: 'OK' }]
                  : [
                      { text: 'Maybe Later', style: 'cancel' },
                      { text: 'Upgrade to Premium', onPress: () => navigation.navigate('Settings', { screen: 'Subscription' }) },
                    ]
              );
            } else {
              navigation.navigate('AIAnalysis', { hand });
            }
          }}
          style={[
            styles.primaryButton,
            (gtoQuotaInfo && !gtoQuotaInfo.canUse && !hand?.analysis) && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {hand.analysis
              ? 'View AI Solver'
              : `AI Solver${gtoQuotaInfo && !gtoQuotaInfo.isPremium && gtoQuotaInfo.remainingFree >= 0 ? ` (${gtoQuotaInfo.remainingFree})` : ''}`}
          </Text>
        </TouchableOpacity>
      </View>
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
    gap: theme.spacing.xs,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
    paddingVertical: theme.spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: theme.font.size.body,
  },
  navBackButton: {
    marginLeft: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  navBackButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  navEditButton: {
    marginRight: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  navEditButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  aiAnalysisButton: {
    backgroundColor: '#FF8C00', // 橘色背景
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
  },
  aiAnalysisButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
    textAlign: 'center',
  },
  aiAnalysisButtonDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  shareButton: {
    backgroundColor: theme.colors.profit,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  aiButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiButtonDisabled: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  aiButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
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
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: theme.font.size.body,
    color: theme.colors.loss,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2, // 為底部固定按鈕預留空間
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  infoGrid: {
    gap: theme.spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  heroSingleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  inlineCardsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  cardWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.border || '#E5E7EB',
  },
  cardText: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
  },
  boardContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  noDataText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
  },
  villainContainer: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  villainTitle: {
    fontSize: theme.font.size.small,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  detailsText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 24,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.input,
    minHeight: 120,
  },
  noteText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  bbText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  analysisText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    lineHeight: 24,
  },
  analysisDate: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: theme.spacing.sm,
    textAlign: 'right',
  },
  reanalysisButton: {
    backgroundColor: theme.colors.inputBg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  reanalysisButtonText: {
    fontSize: theme.font.size.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  analysisLoadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  analysisLoadingText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  analysisLoadingSubText: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: theme.spacing.xs,
  },
  analysisContainer: {
    paddingTop: theme.spacing.sm,
  },
  noAnalysisContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  noAnalysisText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  startAnalysisButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
  },
  startAnalysisButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.body,
  },
  analysisHeader: {
    marginBottom: theme.spacing.sm,
  },
  analysisTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: theme.font.size.small,
  },
  analysisContentContainer: {
    paddingTop: theme.spacing.sm,
  },
  emptyAnalysisContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyAnalysisText: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aiAnalysisLinkContainer: {
    // Remove extra padding since section already provides it
  },
  aiAnalysisLinkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  aiAnalysisLinkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  aiAnalysisStatus: {
    fontSize: theme.font.size.small,
    color: theme.colors.profit,
    fontWeight: '600',
  },
  aiAnalysisArrow: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
    fontWeight: '600',
  },
  aiAnalysisPreview: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    fontStyle: 'italic',
  },
  boardLabel: {
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    minHeight: 16,
    lineHeight: 16,
  },
  boardLabelEmpty: {
    minHeight: 16,
    marginBottom: 4,
  },
  boardLabelPlaceholder: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: theme.font.size.small,
    fontWeight: '500',
  },
});
