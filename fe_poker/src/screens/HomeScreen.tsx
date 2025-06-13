import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AdBanner } from '../components/AdBanner';

const filterOptions = [
  { key: 'all', label: 'All Hands' },
  { key: 'favorites', label: 'Favorites ⭐' },
  { key: 'recent', label: 'Recent' },
  { key: 'profitable', label: 'Profitable' },
  { key: 'losses', label: 'Losses' },
];

const sortOptions = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { stats, sessions, hands, fetchSessions, fetchHands, fetchStats, deleteHand, analyzeHand, toggleFavorite } = useSessionStore();
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
      Alert.alert("Error", `Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showHandActions = (handId: string) => {
    const hand = hands.find(h => h.id === handId);
    if (!hand) return;

    const actionButtons = [
      {
        text: "View Details",
        onPress: () => navigation.navigate('HandDetail', { handId })
      },
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
        text: hand.favorite ? "Remove from Favorites ⭐" : "Add to Favorites ⭐",
        onPress: () => handleToggleFavorite(handId)
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
        text: sortKey === 'date' ? 'Newest First' : 'Highest First',
        onPress: () => {
          setSelectedSort(sortKey);
          setSortDirection('desc');
        }
      },
      {
        text: sortKey === 'date' ? 'Oldest First' : 'Lowest First',
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
    // Handle empty or invalid date strings
    if (!dateStr || dateStr.trim() === '') {
      return 'Unknown date';
    }
    
    const now = new Date();
    const handDate = new Date(dateStr);
    
    // Check if the date is valid
    if (isNaN(handDate.getTime())) {
      return 'Invalid date';
    }
    
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
                  <View style={styles.filterDropdownTextContainer}>
                    <Text style={[
                      styles.filterDropdownText,
                      selectedFilter === option.key && styles.selectedFilterDropdownText
                    ]}>
                      {option.key === 'favorites' ? 'Favorites' : option.label}
                    </Text>
                    {option.key === 'favorites' && (
                      <Text style={[
                        styles.filterDropdownStar,
                        selectedFilter === option.key && styles.selectedFilterDropdownText
                      ]}>
                        ⭐
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
        <Text style={styles.usageHint}>Tap to view • Long press for more actions</Text>
      )}

      {/* Ad Banner */}
      <AdBanner style={styles.adBanner} />

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
                  {hand.analysis && (
                    <Text style={styles.analysisIndicator}>✨</Text>
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
                <Text style={styles.timeAgo}>{timeAgo}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Action Button - Fixed at bottom right */}
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => navigation.navigate('NewSession')}
      >
        <Text style={styles.fabButtonText}>+</Text>
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
  fabButton: {
    position: 'absolute',
    bottom: 0, // 設定為0，貼近底部
    left: '50%', // 水平居中的起始點
    marginLeft: -28, // 負的半徑值來實現完美居中 (56/2 = 28)
    width: 56, // iOS標準FAB尺寸
    height: 56,
    borderRadius: 28, // 完美的圓形
    backgroundColor: '#007AFF', // iOS藍色
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android陰影
  },
  fabButtonText: {
    color: '#fff',
    fontSize: 24, // 較大的+號
    fontWeight: '300', // iOS系統字體風格
    lineHeight: 28,
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
    paddingBottom: 30, // 減少底部空間，因為FAB較小
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
  analysisIndicator: {
    fontSize: 16,
    marginLeft: theme.spacing.xs,
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
  adBanner: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
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
}); 