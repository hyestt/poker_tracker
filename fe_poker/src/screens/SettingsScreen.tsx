import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../theme';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {

  const handleMenuPress = (item: string) => {
    Alert.alert('功能開發中', `${item} 功能即將推出`);
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderMenuItem = (icon: string, title: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress || (() => handleMenuPress(title))}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {/* Membership Section */}
        {renderSectionHeader('Membership')}
        <View style={styles.section}>
          {renderMenuItem('👑', 'Membership Status', 'Free\nRemaining Scans: 50')}
          {renderMenuItem('🔄', 'Restore Purchase')}
        </View>

        {/* Pro Features Section */}
        {renderSectionHeader('Pro Features')}
        <View style={styles.section}>
          {renderMenuItem('📊', 'Export to Excel')}
          {renderMenuItem('🎯', 'Advanced Analytics')}
          {renderMenuItem('📱', 'Auto Save to Photo Library', 'Pro Only')}
          {renderMenuItem('🤖', 'AI Hand Analysis', 'Unlimited')}
        </View>

        {/* Support Section */}
        {renderSectionHeader('Support')}
        <View style={styles.section}>
          {renderMenuItem('👍', 'Rate Us')}
          {renderMenuItem('💬', 'Contact Us')}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Ver. 1.0.0 Made with ❤️</Text>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border || '#E5E7EB',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
    width: 24,
    textAlign: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: theme.colors.gray,
    lineHeight: 16,
  },
  menuArrow: {
    fontSize: 18,
    color: theme.colors.gray,
    fontWeight: '300',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  appInfoText: {
    fontSize: 14,
    color: theme.colors.gray,
    fontWeight: '400',
  },
}); 