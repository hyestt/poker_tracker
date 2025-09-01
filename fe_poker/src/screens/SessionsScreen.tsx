import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '../viewmodels/sessionStore';
import { Session } from '../models';
import { theme } from '../theme';

export const SessionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  console.log('📋 [SessionsScreen] Component mounted');
  const { sessions, hands, fetchSessions, fetchHands, deleteSession } = useSessionStore();
  const [loading, setLoading] = useState(true);
  console.log('📋 [SessionsScreen] Initial data - sessions:', sessions.length, 'hands:', hands.length);
  const insets = useSafeAreaInsets();

  // Filter states
  const [sessionFilter, setSessionFilter] = useState<{
    location?: string;
    tag?: string;
    timeRange?: string;
    customStartDate?: string;
    customEndDate?: string;
  }>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSessionFilter, setTempSessionFilter] = useState<{
    location?: string;
    tag?: string;
    timeRange?: string;
    customStartDate?: string;
    customEndDate?: string;
  }>({});

  // Sort states
  const [selectedSort, setSelectedSort] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    console.log('📋 [SessionsScreen] useEffect - loading session data');
    const loadData = async () => {
      try {
        // 如果數據已經存在，跳過載入直接顯示
        if (sessions.length > 0) {
          console.log('📋 [SessionsScreen] Sessions data already available, skipping load');
          setLoading(false);
          return;
        }

        console.log('🔄 [SessionsScreen] Loading sessions and hands data...');
        await Promise.all([fetchSessions(), fetchHands()]);
        console.log('✅ [SessionsScreen] Data loaded successfully - sessions:', sessions.length, 'hands:', hands.length);
      } catch (error) {
        console.error('❌ [SessionsScreen] Error loading sessions data:', error);
      } finally {
        console.log('🔄 [SessionsScreen] Data loading completed, setting loading to false');
        setLoading(false);
      }
    };

    loadData();
  }, [sessions.length, fetchSessions, fetchHands]);

  // Sessions 保持顯示底部 TabBar（不做隱藏）

  // Calculate session duration
  const getSessionDuration = (session: Session) => {
    if (!session.date) {return '';}

    const startTime = new Date(session.date).getTime();
    let endTime: number;

    // 如果有 cashOutTime，使用 cashOutTime；否則使用當前時間
    if (session.cashOutTime) {
      // 解析 cashOutTime 格式 "2025/08/10 15:06"
      const cashOutDate = session.cashOutTime.replace(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/, '$1-$2-$3T$4:$5');
      endTime = new Date(cashOutDate).getTime();
    } else {
      endTime = new Date().getTime();
    }

    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / (1000 * 60));

    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) { // 1440 minutes = 24 hours
      const hours = Math.floor(minutes / 60);
      return `${hours} h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} d`;
    }
  };

  // Calculate session statistics
  const getSessionStats = (session: Session) => {
    const sessionHands = hands.filter(hand => hand.sessionId === session.id);
    const handCount = sessionHands.length;

    let totalResult = 0;

    // 如果 session 有 cashOut (已結束)，使用 cashOut - buyIn
    if (session.cashOut !== undefined && session.cashOut !== null) {
      const buyIn = session.buyIn || 0;
      totalResult = session.cashOut - buyIn;
    } else {
      // 如果 session 沒有 cashOut (進行中)，使用原來的手牌累加邏輯
      totalResult = sessionHands.reduce((sum, hand) => sum + hand.result, 0);
    }

    return { totalResult, handCount };
  };

  // Filter and sort sessions
  const getFilteredSessions = () => {
    let filtered = [...sessions];

    // Apply filters
    if (sessionFilter.location || sessionFilter.tag || sessionFilter.timeRange || sessionFilter.customStartDate || sessionFilter.customEndDate) {
      filtered = filtered.filter(session => {
        // Location filter
        if (sessionFilter.location && session.location !== sessionFilter.location) {
          return false;
        }

        // Tag filter
        if (sessionFilter.tag && session.tag !== sessionFilter.tag) {
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

        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (selectedSort) {
        case 'date':
          comparison = new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
          break;
        case 'amount':
          const aStats = getSessionStats(a);
          const bStats = getSessionStats(b);
          comparison = aStats.totalResult - bStats.totalResult;
          break;
        default:
          return 0;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  const sortedSessions = getFilteredSessions();

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekDay = weekDays[date.getDay()];
      return weekDay + ', ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown date';
    }
  };

  // Get session color based on result
  const getSessionColor = (result: number) => {
    if (result > 0) {return theme.colors.profit;}
    if (result < 0) {return theme.colors.loss;}
    return theme.colors.gray;
  };

  // Handle session deletion
  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const sessionHands = hands.filter(hand => hand.sessionId === sessionId);

    if (!session) {return;}

    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.location || 'Untitled Session'}" session? This will also delete all ${sessionHands.length} hand(s) in this session.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  // Show session actions on long press
  const showSessionActions = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {return;}

    const actionButtons = [
      {
        text: 'Edit Session',
        onPress: () => navigation.navigate('EditSession', { sessionId }),
      },
      {
        text: 'Delete Session',
        style: 'destructive' as const,
        onPress: () => handleDeleteSession(sessionId),
      },
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
    ];

    Alert.alert(
      'Session Actions',
      `What would you like to do with "${session.location || 'Untitled Session'}" session?`,
      actionButtons
    );
  };

  const handleAddSessionPress = () => {
    console.log('➕ [SessionsScreen] Add button pressed - navigating to NewSession');
    navigation.navigate('NewSession');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Text style={styles.headerTitle}>Sessions</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setTempSessionFilter(sessionFilter);
            setShowFilterModal(true);
          }}
        >
          <Text style={styles.filterText}>
            {(() => {
              const activeFilters = [
                sessionFilter.location,
                sessionFilter.tag,
                sessionFilter.timeRange,
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
        <TouchableOpacity
          style={[
            styles.sortOption,
            selectedSort === 'date' && styles.selectedSortOption,
          ]}
          onPress={() => {
            if (selectedSort === 'date') {
              setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
            } else {
              setSelectedSort('date');
              setSortDirection('desc');
            }
          }}
        >
          <Text style={[
            styles.sortOptionText,
            selectedSort === 'date' && styles.selectedSortOptionText,
          ]}>
            Date {selectedSort === 'date' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortOption,
            selectedSort === 'amount' && styles.selectedSortOption,
          ]}
          onPress={() => {
            if (selectedSort === 'amount') {
              setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
            } else {
              setSelectedSort('amount');
              setSortDirection('desc');
            }
          }}
        >
          <Text style={[
            styles.sortOptionText,
            selectedSort === 'amount' && styles.selectedSortOptionText,
          ]}>
            Amount {selectedSort === 'amount' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Usage Hint */}
      {sortedSessions.length > 0 && (
        <Text style={styles.usageHint}>Tap to view • Long press for more actions</Text>
      )}

      {/* Sessions List */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {sortedSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Create your first session to get started</Text>
          </View>
        ) : (
          sortedSessions.map((session) => {
            const { totalResult, handCount } = getSessionStats(session);
            const sessionBB = session.bigBlind ? Math.round((totalResult / session.bigBlind) * 10) / 10 : 0;
            const duration = getSessionDuration(session);

            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                onLongPress={() => showSessionActions(session.id)}
              >
                {/* Left: Session Info */}
                <View style={styles.leftSection}>
                  <View style={styles.sessionInfoRow}>
                    {session.tag && (
                      <View style={[
                        styles.sessionColorDot,
                        { backgroundColor: getTagColor(session.tag) },
                      ]} />
                    )}
                    <View style={styles.sessionTextInfo}>
                      <Text style={styles.sessionLocation}>
                        {session.location || 'Unknown'}
                      </Text>
                      {session.smallBlind && session.bigBlind && (
                        <Text style={styles.sessionStakes}>
                          • ${session.smallBlind}/${session.bigBlind}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>

                {/* Middle: Amount & BB */}
                <View style={styles.rightSection}>
                  <Text style={[
                    styles.sessionProfit,
                    { color: getSessionColor(totalResult) },
                  ]}>
                    {totalResult >= 0 ? '+' : ''}${totalResult.toFixed(2)}
                  </Text>
                  {session.bigBlind && (
                    <Text style={[
                      styles.sessionBB,
                      { color: getSessionColor(totalResult) },
                    ]}>
                      {sessionBB >= 0 ? '+' : ''}{sessionBB} BB
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button for New Session */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleAddSessionPress}
      >
        <Text style={styles.fabButtonText}>+</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
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
            <Text style={styles.modalTitle}>Filter Sessions</Text>

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

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      const locations = ['All Locations'].concat(
                        [...new Set(sessions.map(s => s.location).filter(loc => loc))]
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

              {/* Color Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Session Color</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      const tags = [
                        { key: '', name: 'All Tags', color: 'transparent' },
                        { key: 'red', name: 'Red', color: '#FF6B6B' },
                        { key: 'blue', name: 'Blue', color: '#007AFF' },
                        { key: 'green', name: 'Green', color: '#34C759' },
                        { key: 'yellow', name: 'Yellow', color: '#FFA726' },
                        { key: 'purple', name: 'Purple', color: '#AB47BC' },
                        { key: 'orange', name: 'Orange', color: '#FF7043' },
                        { key: 'pink', name: 'Pink', color: '#EC407A' },
                        { key: 'teal', name: 'Teal', color: '#26A69A' },
                      ];

                      Alert.alert(
                        'Select Session Color',
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
                      {tempSessionFilter.tag && (
                        <View style={[
                          styles.tagColorDot,
                          { backgroundColor: getTagColor(tempSessionFilter.tag) },
                        ]} />
                      )}
                      <Text style={styles.dropdownText}>
                        {tempSessionFilter.tag
                          ? tempSessionFilter.tag.charAt(0).toUpperCase() + tempSessionFilter.tag.slice(1)
                          : 'All Tags'
                        }
                      </Text>
                    </View>
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

// Helper function to get tag color
const getTagColor = (tag: string) => {
  const tagColors: { [key: string]: string } = {
    'red': '#FF6B6B',
    'blue': '#007AFF',
    'green': '#34C759',
    'yellow': '#FFA726',
    'purple': '#AB47BC',
    'orange': '#FF7043',
    'pink': '#EC407A',
    'teal': '#26A69A',
  };
  return tagColors[tag] || '#ccc';
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  headerTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    textAlign: 'center',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#e0e0e0',
  },
  leftSection: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sessionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  sessionTextInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionLocation: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionStakes: {
    fontSize: theme.font.size.small,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  sessionSubtitle: {
    fontSize: theme.font.size.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sessionDate: {
    fontSize: theme.font.size.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  sessionProfit: {
    fontSize: theme.font.size.subtitle,
    fontWeight: 'bold',
  },
  sessionBB: {
    fontSize: theme.font.size.small,
    marginTop: 2,
  },

  // Filter styles
  filterButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputBg,
  },
  filterText: {
    fontSize: theme.font.size.small,
    color: theme.colors.text,
    fontWeight: '600',
  },

  // Sort styles
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
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
  usageHint: {
    textAlign: 'center',
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    fontStyle: 'italic',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  modalContent: {
    maxHeight: 300,
    paddingHorizontal: theme.spacing.lg,
  },
  filterSection: {
    paddingVertical: theme.spacing.md,
  },
  filterSectionTitle: {
    fontSize: theme.font.size.subtitle,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  dropdownContainer: {
    marginBottom: theme.spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border || '#E5E7EB',
  },
  dropdownText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
  },
  dropdownArrow: {
    fontSize: theme.font.size.small,
    color: theme.colors.gray,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },

  // Modal action buttons
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.inputBg,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text,
    fontWeight: '600',
  },

  // FAB Button styles
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
});
