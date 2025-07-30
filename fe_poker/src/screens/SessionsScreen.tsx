import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionStore } from '../viewmodels/sessionStore';
import { theme } from '../theme';
import { Session } from '../models';

export const SessionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { sessions, hands, fetchSessions, fetchHands, deleteSession } = useSessionStore();
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  // Filter states
  const [sessionFilter, setSessionFilter] = useState<{
    location?: string;
    tag?: string;
  }>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSessionFilter, setTempSessionFilter] = useState<{
    location?: string;
    tag?: string;
  }>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchSessions(), fetchHands()]);
      } catch (error) {
        console.error('Error loading sessions data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate session statistics
  const getSessionStats = (sessionId: string) => {
    const sessionHands = hands.filter(hand => hand.sessionId === sessionId);
    const totalResult = sessionHands.reduce((sum, hand) => sum + hand.result, 0);
    const handCount = sessionHands.length;
    return { totalResult, handCount };
  };

  // Filter and sort sessions
  const getFilteredSessions = () => {
    let filtered = [...sessions];
    
    // Apply filters
    if (sessionFilter.location || sessionFilter.tag) {
      filtered = filtered.filter(session => {
        // Location filter
        if (sessionFilter.location && session.location !== sessionFilter.location) {
          return false;
        }
        
        // Tag filter
        if (sessionFilter.tag && session.tag !== sessionFilter.tag) {
          return false;
        }
        
        return true;
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
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
    if (result > 0) return theme.colors.profit;
    if (result < 0) return theme.colors.loss;
    return theme.colors.gray;
  };

  // Handle session deletion
  const handleDeleteSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const sessionHands = hands.filter(hand => hand.sessionId === sessionId);
    
    if (!session) return;

    Alert.alert(
      "Delete Session",
      `Are you sure you want to delete "${session.location}" session? This will also delete all ${sessionHands.length} hand(s) in this session.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSession(sessionId);
            } catch (error) {
              Alert.alert("Error", "Failed to delete session");
            }
          }
        }
      ]
    );
  };

  // Show session actions on long press
  const showSessionActions = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const actionButtons = [
      {
        text: "Edit Session",
        onPress: () => navigation.navigate('EditSession', { sessionId })
      },
      {
        text: "Delete Session",
        style: "destructive" as const,
        onPress: () => handleDeleteSession(sessionId)
      },
      {
        text: "Cancel",
        style: "cancel" as const
      }
    ];

    Alert.alert(
      "Session Actions",
      `What would you like to do with "${session.location}" session?`,
      actionButtons
    );
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
            {sessionFilter.location || sessionFilter.tag ? '☰ Active' : '☰ Filter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {sortedSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Create your first session to get started</Text>
          </View>
        ) : (
          sortedSessions.map((session) => {
            const { totalResult, handCount } = getSessionStats(session.id);
            const sessionBB = session.bigBlind ? Math.round((totalResult / session.bigBlind) * 10) / 10 : 0;
            
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
                    <Text style={styles.sessionLocation}>{session.location}</Text>
                  </View>
                  <Text style={styles.sessionSubtitle}>
                    ${session.smallBlind}/${session.bigBlind} • {handCount} hand{handCount !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>

                {/* Middle: Amount & BB */}
                <View style={styles.rightSection}>
                  <Text style={[
                    styles.sessionProfit,
                    { color: getSessionColor(totalResult) }
                  ]}>
                    {totalResult >= 0 ? '+' : ''}${totalResult.toFixed(2)}
                  </Text>
                  {session.bigBlind && (
                    <Text style={[
                      styles.sessionBB,
                      { color: getSessionColor(totalResult) }
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
        onPress={() => navigation.navigate('NewSession')}
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
          <View style={styles.filterModal}>
            <Text style={styles.modalTitle}>Filter Sessions</Text>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              
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
                        "Select Location",
                        "",
                        locations.map(location => ({
                          text: location,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev, 
                              location: location === 'All Locations' ? undefined : location
                            }));
                          }
                        })).concat([{ text: "Cancel", onPress: () => {} }])
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

              {/* Tag Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Session Tag</Text>
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
                        "Select Session Tag",
                        "",
                        tags.map(tag => ({
                          text: tag.name,
                          onPress: () => {
                            setTempSessionFilter(prev => ({
                              ...prev, 
                              tag: tag.key || undefined
                            }));
                          }
                        })).concat([{ text: "Cancel", onPress: () => {} }])
                      );
                    }}
                  >
                    <View style={styles.dropdownContent}>
                      {tempSessionFilter.tag && (
                        <View style={[
                          styles.tagColorDot,
                          { backgroundColor: getTagColor(tempSessionFilter.tag) }
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
  sessionLocation: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
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
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
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