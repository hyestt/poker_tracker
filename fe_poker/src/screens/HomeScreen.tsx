import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const filterOptions = [
  { key: 'all', label: 'All Hands' },
  { key: 'recent', label: 'Recent' },
  { key: 'profitable', label: 'Profitable' },
  { key: 'losses', label: 'Losses' },
];

const sortOptions = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { stats, sessions, hands, fetchSessions, fetchHands, fetchStats, deleteHand, analyzeHand } = useSessionStore();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [sessionFilter, setSessionFilter] = useState<{location?: string, blinds?: string, dateTime?: string}>({});

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSessionFilter, setTempSessionFilter] = useState<{location?: string, blinds?: string, dateTime?: string}>({});
  

  
  // 計算有實際手牌記錄的 sessions 數量
  const activeSessions = sessions.filter(session => 
    hands.some(hand => hand.sessionId === session.id)
  );

  useEffect(() => {
    fetchSessions();
    fetchHands();
    fetchStats();
  }, []);

  // Filter and sort hands
  const getFilteredHands = () => {
    let filtered = [...hands];
    


    // Session filter
    if (sessionFilter.location || sessionFilter.blinds || sessionFilter.dateTime) {
      filtered = filtered.filter(hand => {
        const session = sessions.find(s => s.id === hand.sessionId);
        if (!session) return false;

        // Location filter
        if (sessionFilter.location && session.location !== sessionFilter.location) {
          return false;
        }

        // Blinds filter
        if (sessionFilter.blinds) {
          const sessionBlinds = `${session.smallBlind}/${session.bigBlind}`;
          if (sessionBlinds !== sessionFilter.blinds) {
            return false;
          }
        }

        // Date & Time filter (session date)
        if (sessionFilter.dateTime && session.date !== sessionFilter.dateTime) {
          return false;
        }

        return true;
      });
    }
    
    // Other filters
    switch (selectedFilter) {
      case 'recent':
        filtered = filtered.slice(-10);
        break;
      case 'profitable':
        filtered = filtered.filter(hand => hand.result > 0);
        break;
      case 'losses':
        filtered = filtered.filter(hand => hand.result < 0);
        break;
      default:
        break;
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (selectedSort) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
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
    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this hand record?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { text: "Delete", onPress: () => deleteHand(id) }
      ]
    );
  };

  const handleAnalyze = async (id: string) => {
    try {
      const analysis = await analyzeHand(id);
      Alert.alert("AI Analysis Result", analysis, [{ text: "OK" }]);
    } catch (error) {
      Alert.alert("Analysis Failed", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const showHandActions = (handId: string) => {
    const hand = hands.find(h => h.id === handId);
    if (!hand) return;

    const actionButtons = [
      {
        text: "Edit Hand",
        onPress: () => navigation.navigate('EditHand', { handId })
      },
      {
        text: "Edit Session",
        onPress: () => navigation.navigate('EditSession', { sessionId: hand.sessionId })
      },
      {
        text: hand.analysis ? "View Analysis" : "AI Analysis", 
        onPress: () => handleAnalyze(handId)
      },
      {
        text: "Delete",
        style: "destructive" as const,
        onPress: () => handleDelete(handId)
      },
      {
        text: "Cancel",
        style: "cancel" as const
      }
    ];

    Alert.alert(
      "Hand Actions",
      `What would you like to do with this hand?`,
      actionButtons
    );
  };

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const showFilterOptions = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const showSortOptions = (sortKey: string) => {
    const sortButtons = [
      {
        text: `${sortKey === 'date' ? 'Date' : 'Amount'} - 大到小`,
        onPress: () => {
          setSelectedSort(sortKey);
          setSortDirection('desc');
        }
      },
      {
        text: `${sortKey === 'date' ? 'Date' : 'Amount'} - 小到大`,
        onPress: () => {
          setSelectedSort(sortKey);
          setSortDirection('asc');
        }
      },
      {
        text: "Cancel",
        onPress: () => {}
      }
    ];

    Alert.alert(
      "Sort Options",
      `Choose how to sort by ${sortKey === 'date' ? 'Date' : 'Amount'}:`,
      sortButtons
    );
  };



  // Format time ago
  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const handDate = new Date(dateStr);
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
  const getBBAmount = (result: number, sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.bigBlind) return '';
    const bbAmount = Math.round((result / session.bigBlind) * 10) / 10;
    return `${bbAmount >= 0 ? '' : ''}${bbAmount} BB`;
  };

  // Render card icons
  const renderCardIcons = (holeCards: string | undefined) => {
    if (!holeCards) return null;
    
    // Parse cards like "AcKc" or "7d As"
    const cards = holeCards.replace(/\s+/g, '').match(/.{2}/g) || [];
    
    return (
      <View style={styles.cardContainer}>
        {cards.map((card, index) => {
          const rank = card[0];
          const suit = card[1];
          const suitSymbol = suit === 'c' ? '♣' : suit === 'd' ? '♦' : suit === 'h' ? '♥' : '♠';
          const isRed = suit === 'd' || suit === 'h';
          
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

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
                    selectedFilter === option.key && styles.selectedFilterDropdownItem
                  ]}
                  onPress={() => {
                    setSelectedFilter(option.key);
                    setShowFilterDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.filterDropdownText,
                    selectedFilter === option.key && styles.selectedFilterDropdownText
                  ]}>
                    {option.label}
                  </Text>
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
            {sessionFilter.location || sessionFilter.blinds || sessionFilter.dateTime ? '🎯 Active' : '🎯 Filter'}
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
              selectedSort === option.key && styles.selectedSortOption
            ]}
            onPress={() => showSortOptions(option.key)}
          >
            <Text style={[
              styles.sortOptionText,
              selectedSort === option.key && styles.selectedSortOptionText
            ]}>
              {option.label} {selectedSort === option.key ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>



      {/* Usage Hint */}
      {filteredHands.length > 0 && (
        <Text style={styles.usageHint}>Tap to edit • Long press for more actions</Text>
      )}

      {/* Hands List */}
      <ScrollView 
        style={styles.handsContainer}
      >
        {filteredHands.length === 0 && (
          <Text style={styles.empty}>No hands found</Text>
        )}
        {filteredHands.map((hand) => {
          const session = sessions.find(s => s.id === hand.sessionId);
          const timeAgo = getTimeAgo(hand.date);
          const bbAmount = getBBAmount(hand.result, hand.sessionId);
          
          return (
            <TouchableOpacity 
              key={hand.id} 
              style={styles.handItem}
              onPress={() => navigation.navigate('EditHand', { handId: hand.id })}
              onLongPress={() => showHandActions(hand.id)}
            >
              {/* Left: Card Icons */}
              <View style={styles.leftSection}>
                {renderCardIcons(hand.holeCards)}
              </View>

              {/* Middle: Hand Info */}
              <View style={styles.middleSection}>
                <View style={styles.handTitleRow}>
                  <Text style={styles.handTitle}>
                    {hand.holeCards 
                      ? `${hand.holeCards.replace(/[cdhs]/g, '').trim()}${hand.position ? ` in ${hand.position}` : ''}`
                      : (hand.position || hand.details.slice(0, 20))}
                  </Text>
                  {hand.analysis && (
                    <Text style={styles.analysisIndicator}>✨</Text>
                  )}
                </View>
                <Text style={styles.timeAgo}>{timeAgo}</Text>
              </View>

              {/* Right: Amount & BB */}
              <View style={styles.rightSection}>
                <Text style={[
                  styles.amount,
                  { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss }
                ]}>
                  ${Math.abs(hand.result).toFixed(2)}
                </Text>
                {bbAmount && (
                  <Text style={[
                    styles.bbAmount,
                    { color: hand.result >= 0 ? theme.colors.profit : theme.colors.loss }
                  ]}>
                    {bbAmount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Record New Hand Button - Fixed at bottom */}
      <TouchableOpacity 
        style={styles.recordButton}
        onPress={() => navigation.navigate('NewSession')}
      >
        <Text style={styles.recordButtonText}>+ Record New Hand</Text>
              </TouchableOpacity>

      {/* iOS Style Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <Text style={styles.modalTitle}>Session Filter</Text>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Session Date Filter - First */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Session Date</Text>
                {[...new Set(sessions.map(s => s.date).filter(Boolean))].map(date => (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.filterOption,
                      tempSessionFilter.dateTime === date && styles.selectedFilterOption
                    ]}
                    onPress={() => {
                      if (tempSessionFilter.dateTime === date) {
                        setTempSessionFilter(prev => ({...prev, dateTime: undefined}));
                      } else {
                        setTempSessionFilter(prev => ({...prev, dateTime: date}));
                      }
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      tempSessionFilter.dateTime === date && styles.selectedFilterOptionText
                    ]}>
                      {date}
                    </Text>
                    {tempSessionFilter.dateTime === date && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                {[...new Set(sessions.map(s => s.location).filter(Boolean))].map(location => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.filterOption,
                      tempSessionFilter.location === location && styles.selectedFilterOption
                    ]}
                    onPress={() => {
                      if (tempSessionFilter.location === location) {
                        setTempSessionFilter(prev => ({...prev, location: undefined}));
                      } else {
                        setTempSessionFilter(prev => ({...prev, location}));
                      }
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      tempSessionFilter.location === location && styles.selectedFilterOptionText
                    ]}>
                      {location}
                    </Text>
                    {tempSessionFilter.location === location && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Blinds Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Blinds</Text>
                {[...new Set(sessions.map(s => `${s.smallBlind}/${s.bigBlind}`))].map(blinds => (
                  <TouchableOpacity
                    key={blinds}
                    style={[
                      styles.filterOption,
                      tempSessionFilter.blinds === blinds && styles.selectedFilterOption
                    ]}
                    onPress={() => {
                      if (tempSessionFilter.blinds === blinds) {
                        setTempSessionFilter(prev => ({...prev, blinds: undefined}));
                      } else {
                        setTempSessionFilter(prev => ({...prev, blinds}));
                      }
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      tempSessionFilter.blinds === blinds && styles.selectedFilterOptionText
                    ]}>
                      {blinds}
                    </Text>
                    {tempSessionFilter.blinds === blinds && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  settingsButton: {
    padding: theme.spacing.xs,
  },
  settingsIcon: {
    fontSize: 24,
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    position: 'absolute',
    bottom: 100, // Just above the tab bar
    left: 0,
    right: 0,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
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
    backgroundColor: '#fff',
    borderRadius: theme.radius.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    marginTop: theme.spacing.xs,
    zIndex: 1001,
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
  filterDropdownText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
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
    paddingBottom: 120, // Space for the button
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
    backgroundColor: '#fff',
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
  handTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  analysisIndicator: {
    fontSize: 16,
    marginLeft: theme.spacing.xs,
  },
  timeAgo: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    marginTop: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: theme.radius.card,
    borderTopRightRadius: theme.radius.card,
    padding: theme.spacing.lg,
    height: '85%',
    shadowColor: '#000',
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
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 50,
  },
  selectedFilterOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  selectedFilterOptionText: {
    color: 'white',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
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
}); 