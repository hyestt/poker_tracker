import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Hand, Session, Villain } from '../models';

export const HandDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { handId } = route.params;
  const { getHand, getSession } = useSessionStore();
  const [hand, setHand] = useState<Hand | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const handData = await getHand(handId);
        const sessionData = await getSession(handData.sessionId);
        setHand(handData);
        setSession(sessionData);
      } catch (error) {
        console.error('Failed to load hand/session:', error);
        Alert.alert('Error', 'Failed to load hand details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [handId, getHand, getSession]);



  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? '#DC2626' : '#000000';
  };

  const renderCards = (cards: string, isBoard = false) => {
    if (!cards) return null;
    
    const cardArray = cards.split(' ');
    
    return (
      <View style={styles.cardsContainer}>
        {cardArray.map((card, index) => {
          const rank = card.slice(0, -1);
          const suit = card.slice(-1);
          
          let label = '';
          if (isBoard) {
            if (index === 1) label = 'Flop';
            else if (index === 3) label = 'Turn';
            else if (index === 4) label = 'River';
          }
          
          return (
            <View key={index} style={styles.cardWrapper}>
              {/* Add labels for board cards */}
              {isBoard && (
                <Text style={styles.boardLabel}>
                  {label}
                </Text>
              )}
              
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

  const generateShareText = () => {
    if (!hand || !session) return '';

    const villainText = hand.villains?.map((v, i) => 
      `Villain ${i + 1}: ${v.position || 'Unknown'} - ${v.holeCards || 'Unknown'}`
    ).join('\n') || 'No villains';

    return `Poker Hand Details

Location: ${session.location}
Blinds: $${session.smallBlind}/$${session.bigBlind}
Date: ${session.date}

Hero: ${hand.position || 'Unknown'} - ${hand.holeCards || 'Unknown'}
Board: ${hand.board || 'No flop shown'}

Villains:
${villainText}

Hand Details:
${hand.details || 'No details'}

Note:
${hand.note || 'No note'}

Result: ${hand.result >= 0 ? '+' : ''}$${hand.result}

Shared from Poker Tracker`;
  };

  const handleShare = async () => {
    try {
      const shareText = generateShareText();
      await Share.share({
        message: shareText,
        title: 'Poker Hand Details',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share hand details');
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditHand', { handId });
  };

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
      {/* Header with action buttons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AIAnalysis', { hand })} 
          style={styles.aiAnalysisButton}
        >
          <Text style={styles.aiAnalysisButtonText}>AI Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
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
            { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss }
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
              <Text style={styles.infoValue}>{session.date}</Text>
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
              <Text style={styles.infoLabel}>Effective Stack:</Text>
              <Text style={styles.infoValue}>${session.effectiveStack}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Table Size:</Text>
              <Text style={styles.infoValue}>{session.tableSize || 6} players</Text>
            </View>
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
    gap: theme.spacing.xs,
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
    marginBottom: 2,
  },
  boardLabelPlaceholder: {
    fontSize: theme.font.size.body,
    color: theme.colors.gray,
  },
}); 